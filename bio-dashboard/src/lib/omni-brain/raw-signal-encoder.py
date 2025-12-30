"""
Manpasik Raw Signal Encoder
============================

A deep learning model that processes 88-dimensional raw bio-signals
and extracts micro-features invisible to human analysis.

Philosophy: "A micro-volt shift in the oxidation peak today 
           can predict a chronic disease 3 years later."

Architecture:
- 1D-CNN for local feature extraction from each modality
- Multi-Head Self-Attention for cross-modal reasoning
- Contrastive Learning for signal <-> phenotype mapping
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from typing import List, Dict, Tuple, Optional
import numpy as np
from dataclasses import dataclass
from enum import Enum
import math


# ============================================
# Configuration
# ============================================

@dataclass
class RawSignalConfig:
    """Configuration for Raw Signal Encoder"""
    
    # Raw signal dimensions (the 88-dim tensor breakdown)
    cv_dim: int = 200        # CV curve points (-0.5V to +0.8V sweep)
    eis_real_dim: int = 50   # EIS real impedance (frequency sweep)
    eis_imag_dim: int = 50   # EIS imaginary impedance
    swv_dim: int = 100       # SWV differential pulse
    dpv_dim: int = 100       # DPV trace metals
    
    # Derived 88-dim feature vector (post-processing)
    feature_dim: int = 88
    
    # Environmental context
    env_dim: int = 8         # Temp, Humidity, EHD Voltage, etc.
    
    # User genotype (DNA risk scores)
    genotype_dim: int = 32   # Polygenic risk scores
    
    # Model architecture
    hidden_dim: int = 512
    latent_dim: int = 256    # Contrastive learning embedding dim
    num_cnn_layers: int = 4
    num_attention_heads: int = 8
    num_transformer_layers: int = 4
    dropout: float = 0.1
    
    # Training
    batch_size: int = 64
    learning_rate: float = 1e-4
    temperature: float = 0.07  # Contrastive learning temperature


class SignalModality(Enum):
    """Types of raw signal modalities"""
    CV = "cyclic_voltammetry"
    EIS_REAL = "eis_real_impedance"
    EIS_IMAG = "eis_imaginary_impedance"
    SWV = "square_wave_voltammetry"
    DPV = "differential_pulse_voltammetry"


# ============================================
# Data Structures
# ============================================

@dataclass
class RawSignalTensor:
    """
    The complete raw signal input.
    Instead of a single value (e.g., "Glucose 100"),
    we ingest the full physics tensor.
    """
    
    # CV Curve: Current at each voltage step
    # Shape: [batch, cv_points] - captures peak position, hysteresis, slope
    cv_curve: torch.Tensor
    
    # EIS Spectrum: Real and Imaginary impedance at each frequency
    # Shape: [batch, freq_points] - Nyquist/Bode plot shape
    eis_real: torch.Tensor
    eis_imag: torch.Tensor
    
    # SWV Response: Differential pulse signatures
    # Shape: [batch, swv_points] - trace metals, specific proteins
    swv_response: torch.Tensor
    
    # DPV Response: Additional electrochemical signatures
    # Shape: [batch, dpv_points]
    dpv_response: torch.Tensor
    
    # Environmental Context
    # [Temperature, Humidity, Pressure, EHD_Voltage, Altitude, Time_of_day, ...]
    env_context: torch.Tensor
    
    # User Genotype (DNA-based risk scores)
    # [Diabetes_risk, Cardio_risk, Alzheimer_risk, ...]
    genotype: Optional[torch.Tensor] = None
    
    # Metadata
    signal_quality: Optional[torch.Tensor] = None  # SQI per sample
    timestamp: Optional[torch.Tensor] = None


@dataclass
class EncodedSignal:
    """Output from the Raw Signal Encoder"""
    
    # Primary embedding
    embedding: torch.Tensor           # [batch, latent_dim]
    
    # Modality-specific embeddings (for interpretability)
    cv_embedding: torch.Tensor        # [batch, hidden_dim//4]
    eis_embedding: torch.Tensor       # [batch, hidden_dim//4]
    swv_embedding: torch.Tensor       # [batch, hidden_dim//4]
    dpv_embedding: torch.Tensor       # [batch, hidden_dim//4]
    
    # Micro-anomaly detection scores
    micro_anomalies: Dict[str, torch.Tensor]
    
    # Attention weights for interpretability
    attention_weights: torch.Tensor   # [batch, heads, seq, seq]


# ============================================
# Micro-Feature Extraction Modules
# ============================================

class SignalCNN1D(nn.Module):
    """
    1D-CNN for extracting local features from raw signals.
    Detects "Micro-Anomalies" invisible to human eyes.
    
    Example: "The re-oxidation slope in the CV curve is 2% flatter than usual"
    """
    
    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int = 4):
        super().__init__()
        
        layers = []
        in_channels = 1
        out_channels = hidden_dim // 4
        
        for i in range(num_layers):
            layers.extend([
                nn.Conv1d(in_channels, out_channels, kernel_size=5, padding=2),
                nn.BatchNorm1d(out_channels),
                nn.GELU(),
                nn.MaxPool1d(kernel_size=2, stride=2)
            ])
            in_channels = out_channels
            out_channels = min(out_channels * 2, hidden_dim)
        
        self.cnn = nn.Sequential(*layers)
        
        # Adaptive pooling to fixed size
        self.adaptive_pool = nn.AdaptiveAvgPool1d(8)
        
        # Final projection
        self.projection = nn.Linear(out_channels * 8, hidden_dim)
        
        # Micro-anomaly detector
        self.anomaly_detector = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 10),  # 10 types of micro-anomalies
            nn.Sigmoid()
        )
    
    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            x: Raw signal [batch, signal_length]
        
        Returns:
            features: Extracted features [batch, hidden_dim]
            anomalies: Micro-anomaly scores [batch, 10]
        """
        # Add channel dimension
        x = x.unsqueeze(1)  # [batch, 1, signal_length]
        
        # CNN feature extraction
        x = self.cnn(x)  # [batch, channels, reduced_length]
        
        # Adaptive pooling
        x = self.adaptive_pool(x)  # [batch, channels, 8]
        
        # Flatten and project
        x = x.view(x.size(0), -1)  # [batch, channels * 8]
        features = self.projection(x)  # [batch, hidden_dim]
        
        # Detect micro-anomalies
        anomalies = self.anomaly_detector(features)
        
        return features, anomalies


class MultiModalFusionAttention(nn.Module):
    """
    Multi-head attention for fusing different signal modalities.
    Learns cross-modal relationships.
    """
    
    def __init__(self, hidden_dim: int, num_heads: int = 8, dropout: float = 0.1):
        super().__init__()
        
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True
        )
        
        self.norm = nn.LayerNorm(hidden_dim)
        self.ffn = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim * 4),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim * 4, hidden_dim),
            nn.Dropout(dropout)
        )
        self.norm2 = nn.LayerNorm(hidden_dim)
    
    def forward(
        self, 
        modalities: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            modalities: Stacked modality embeddings [batch, num_modalities, hidden_dim]
        
        Returns:
            fused: Fused representation [batch, hidden_dim]
            attention_weights: [batch, heads, num_modalities, num_modalities]
        """
        # Self-attention across modalities
        attended, weights = self.attention(modalities, modalities, modalities)
        modalities = self.norm(modalities + attended)
        
        # FFN
        modalities = self.norm2(modalities + self.ffn(modalities))
        
        # Pool across modalities (mean)
        fused = modalities.mean(dim=1)
        
        return fused, weights


# ============================================
# Contrastive Learning Module
# ============================================

class ContrastiveProjector(nn.Module):
    """
    Projection head for contrastive learning (SimCLR style).
    Maps signal embeddings to a space where similar health outcomes
    have similar representations.
    """
    
    def __init__(self, input_dim: int, latent_dim: int):
        super().__init__()
        
        self.projector = nn.Sequential(
            nn.Linear(input_dim, input_dim),
            nn.ReLU(),
            nn.Linear(input_dim, latent_dim)
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return F.normalize(self.projector(x), dim=-1)


class NTXentLoss(nn.Module):
    """
    Normalized Temperature-scaled Cross Entropy Loss
    for contrastive learning.
    
    Objective: Minimize distance between users with similar
    raw signal patterns AND similar disease progression.
    """
    
    def __init__(self, temperature: float = 0.07):
        super().__init__()
        self.temperature = temperature
    
    def forward(
        self, 
        z_i: torch.Tensor, 
        z_j: torch.Tensor
    ) -> torch.Tensor:
        """
        Args:
            z_i: Embeddings of first augmentation [batch, latent_dim]
            z_j: Embeddings of second augmentation [batch, latent_dim]
        
        Returns:
            Contrastive loss
        """
        batch_size = z_i.size(0)
        
        # Concatenate
        z = torch.cat([z_i, z_j], dim=0)  # [2*batch, latent_dim]
        
        # Similarity matrix
        sim = torch.mm(z, z.t()) / self.temperature  # [2*batch, 2*batch]
        
        # Mask self-similarity
        mask = torch.eye(2 * batch_size, dtype=torch.bool, device=z.device)
        sim.masked_fill_(mask, float('-inf'))
        
        # Positive pairs: (i, i+batch) and (i+batch, i)
        labels = torch.arange(batch_size, device=z.device)
        labels = torch.cat([labels + batch_size, labels])
        
        loss = F.cross_entropy(sim, labels)
        
        return loss


# ============================================
# Main Encoder Model
# ============================================

class ManpasikRawSignalEncoder(nn.Module):
    """
    The Hyper-Resolution Signal Encoder.
    
    Processes 88-dimensional raw bio-signals and extracts:
    1. Micro-features invisible to humans
    2. Cross-modal relationships
    3. Contrastive embeddings for outcome prediction
    
    "Every electron measured contributes to ecosystem intelligence."
    """
    
    def __init__(self, config: RawSignalConfig):
        super().__init__()
        self.config = config
        
        # Modality-specific CNNs (The Microscope)
        self.cv_encoder = SignalCNN1D(config.cv_dim, config.hidden_dim // 4)
        self.eis_real_encoder = SignalCNN1D(config.eis_real_dim, config.hidden_dim // 4)
        self.eis_imag_encoder = SignalCNN1D(config.eis_imag_dim, config.hidden_dim // 4)
        self.swv_encoder = SignalCNN1D(config.swv_dim, config.hidden_dim // 4)
        self.dpv_encoder = SignalCNN1D(config.dpv_dim, config.hidden_dim // 4)
        
        # Environmental context encoder
        self.env_encoder = nn.Sequential(
            nn.Linear(config.env_dim, config.hidden_dim // 4),
            nn.ReLU(),
            nn.Linear(config.hidden_dim // 4, config.hidden_dim // 4)
        )
        
        # Genotype encoder (optional)
        self.genotype_encoder = nn.Sequential(
            nn.Linear(config.genotype_dim, config.hidden_dim // 4),
            nn.ReLU(),
            nn.Linear(config.hidden_dim // 4, config.hidden_dim // 4)
        )
        
        # Modality projection to common dimension
        self.modality_projections = nn.ModuleDict({
            'cv': nn.Linear(config.hidden_dim // 4, config.hidden_dim),
            'eis': nn.Linear(config.hidden_dim // 2, config.hidden_dim),  # Real + Imag
            'swv': nn.Linear(config.hidden_dim // 4, config.hidden_dim),
            'dpv': nn.Linear(config.hidden_dim // 4, config.hidden_dim),
            'env': nn.Linear(config.hidden_dim // 4, config.hidden_dim),
            'genotype': nn.Linear(config.hidden_dim // 4, config.hidden_dim)
        })
        
        # Multi-modal fusion (The Brain)
        self.fusion_layers = nn.ModuleList([
            MultiModalFusionAttention(config.hidden_dim, config.num_attention_heads, config.dropout)
            for _ in range(config.num_transformer_layers)
        ])
        
        # Contrastive projector
        self.contrastive_projector = ContrastiveProjector(config.hidden_dim, config.latent_dim)
        
        # Micro-anomaly aggregator
        self.anomaly_aggregator = nn.Sequential(
            nn.Linear(50, 32),  # 5 modalities * 10 anomalies each
            nn.ReLU(),
            nn.Linear(32, 16)   # 16 aggregated micro-anomaly types
        )
        
        # Final output projection
        self.output_projection = nn.Linear(config.hidden_dim, config.latent_dim)
    
    def forward(self, signal: RawSignalTensor) -> EncodedSignal:
        batch_size = signal.cv_curve.size(0)
        
        # === Step 1: Encode each modality with CNN ===
        cv_feat, cv_anomalies = self.cv_encoder(signal.cv_curve)
        eis_real_feat, eis_real_anomalies = self.eis_real_encoder(signal.eis_real)
        eis_imag_feat, eis_imag_anomalies = self.eis_imag_encoder(signal.eis_imag)
        swv_feat, swv_anomalies = self.swv_encoder(signal.swv_response)
        dpv_feat, dpv_anomalies = self.dpv_encoder(signal.dpv_response)
        
        # Combine EIS real and imaginary
        eis_feat = torch.cat([eis_real_feat, eis_imag_feat], dim=-1)
        eis_anomalies = torch.cat([eis_real_anomalies, eis_imag_anomalies], dim=-1)
        
        # Encode environmental context
        env_feat = self.env_encoder(signal.env_context)
        
        # Encode genotype if available
        if signal.genotype is not None:
            genotype_feat = self.genotype_encoder(signal.genotype)
        else:
            genotype_feat = torch.zeros(batch_size, self.config.hidden_dim // 4, device=cv_feat.device)
        
        # === Step 2: Project to common dimension ===
        cv_proj = self.modality_projections['cv'](cv_feat)
        eis_proj = self.modality_projections['eis'](eis_feat)
        swv_proj = self.modality_projections['swv'](swv_feat)
        dpv_proj = self.modality_projections['dpv'](dpv_feat)
        env_proj = self.modality_projections['env'](env_feat)
        genotype_proj = self.modality_projections['genotype'](genotype_feat)
        
        # Stack modalities: [batch, num_modalities, hidden_dim]
        modalities = torch.stack([
            cv_proj, eis_proj, swv_proj, dpv_proj, env_proj, genotype_proj
        ], dim=1)
        
        # === Step 3: Multi-modal fusion with attention ===
        attention_weights = None
        for fusion_layer in self.fusion_layers:
            modalities, attn_w = fusion_layer(modalities)
            modalities = modalities.unsqueeze(1)  # Restore dimension for next layer
            if attention_weights is None:
                attention_weights = attn_w
        
        # Final fused representation
        fused = modalities.squeeze(1)  # [batch, hidden_dim]
        
        # === Step 4: Generate outputs ===
        # Main embedding
        embedding = self.output_projection(fused)
        
        # Aggregate micro-anomalies
        all_anomalies = torch.cat([
            cv_anomalies, eis_anomalies, swv_anomalies, dpv_anomalies
        ], dim=-1)
        aggregated_anomalies = self.anomaly_aggregator(all_anomalies)
        
        return EncodedSignal(
            embedding=embedding,
            cv_embedding=cv_feat,
            eis_embedding=eis_feat,
            swv_embedding=swv_feat,
            dpv_embedding=dpv_feat,
            micro_anomalies={
                'cv': cv_anomalies,
                'eis': eis_anomalies,
                'swv': swv_anomalies,
                'dpv': dpv_anomalies,
                'aggregated': aggregated_anomalies
            },
            attention_weights=attention_weights
        )
    
    def get_contrastive_embedding(self, signal: RawSignalTensor) -> torch.Tensor:
        """Get normalized embedding for contrastive learning."""
        encoded = self.forward(signal)
        return self.contrastive_projector(encoded.embedding)


# ============================================
# The Combinatorial Analyzer (The Chemist)
# ============================================

class CombinatorialAnalyzer(nn.Module):
    """
    Analyzes COMBINATIONS of biomarkers, not just individuals.
    
    Example: High Glucose + Low Zinc + High Stress
             → "Cortisol-Induced Hyperglycemia" (not just diabetes)
             → Standard insulin less effective
             → Priority: Magnesium & Meditation
    """
    
    def __init__(self, config: RawSignalConfig):
        super().__init__()
        self.config = config
        
        # Pairwise interaction network
        self.pairwise = nn.Sequential(
            nn.Linear(config.latent_dim * 2, config.hidden_dim),
            nn.ReLU(),
            nn.Linear(config.hidden_dim, config.hidden_dim // 2)
        )
        
        # Higher-order interaction (triplets)
        self.triplet = nn.Sequential(
            nn.Linear(config.latent_dim * 3, config.hidden_dim),
            nn.ReLU(),
            nn.Linear(config.hidden_dim, config.hidden_dim // 2)
        )
        
        # Condition classifier
        self.condition_classifier = nn.Sequential(
            nn.Linear(config.hidden_dim, config.hidden_dim),
            nn.ReLU(),
            nn.Linear(config.hidden_dim, 100)  # 100 condition types
        )
        
        # Treatment recommendation
        self.treatment_head = nn.Sequential(
            nn.Linear(config.hidden_dim + 100, config.hidden_dim),
            nn.ReLU(),
            nn.Linear(config.hidden_dim, 50)  # 50 treatment types
        )
    
    def forward(
        self, 
        embeddings: List[torch.Tensor],  # List of biomarker embeddings
        signal_embedding: torch.Tensor    # Full signal embedding
    ) -> Dict[str, torch.Tensor]:
        """
        Args:
            embeddings: List of individual biomarker embeddings
            signal_embedding: Full encoded signal
        
        Returns:
            conditions: Probability of each condition
            treatments: Recommended treatments with confidence
            interactions: Significant interaction patterns
        """
        batch_size = signal_embedding.size(0)
        
        # Compute pairwise interactions
        pairwise_features = []
        for i in range(len(embeddings)):
            for j in range(i + 1, len(embeddings)):
                pair = torch.cat([embeddings[i], embeddings[j]], dim=-1)
                pairwise_features.append(self.pairwise(pair))
        
        if pairwise_features:
            pairwise_combined = torch.stack(pairwise_features, dim=1).mean(dim=1)
        else:
            pairwise_combined = torch.zeros(batch_size, self.config.hidden_dim // 2, 
                                           device=signal_embedding.device)
        
        # Combine with signal embedding
        combined = torch.cat([signal_embedding, pairwise_combined], dim=-1)
        
        # Classify conditions
        conditions = torch.softmax(self.condition_classifier(combined), dim=-1)
        
        # Recommend treatments (condition-aware)
        treatment_input = torch.cat([combined, conditions], dim=-1)
        treatments = torch.sigmoid(self.treatment_head(treatment_input))
        
        return {
            'conditions': conditions,
            'treatments': treatments,
            'pairwise_interactions': pairwise_combined
        }


# ============================================
# Pattern Matching for Disease Prediction
# ============================================

class PatternMatcher(nn.Module):
    """
    Matches current signal patterns against known disease patterns.
    
    "Users who showed *this specific* EIS distortion pattern (Pattern #402)
     eventually developed Hypertension within 6 months with 89% probability."
    """
    
    def __init__(self, config: RawSignalConfig, num_patterns: int = 500):
        super().__init__()
        
        # Learnable pattern prototypes
        self.patterns = nn.Parameter(torch.randn(num_patterns, config.latent_dim))
        
        # Pattern metadata (disease associations)
        self.pattern_classifier = nn.Linear(num_patterns, 50)  # 50 disease types
        
        # Temporal predictor (time to onset)
        self.temporal_predictor = nn.Sequential(
            nn.Linear(config.latent_dim + num_patterns, config.hidden_dim),
            nn.ReLU(),
            nn.Linear(config.hidden_dim, 50)  # Days to onset (discretized)
        )
    
    def forward(self, embedding: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Args:
            embedding: Signal embedding [batch, latent_dim]
        
        Returns:
            pattern_matches: Similarity to each known pattern
            disease_risks: Probability of each disease
            time_to_onset: Predicted days until manifestation
        """
        # Compute similarity to each pattern
        embedding_norm = F.normalize(embedding, dim=-1)
        patterns_norm = F.normalize(self.patterns, dim=-1)
        
        # Cosine similarity
        similarities = torch.mm(embedding_norm, patterns_norm.t())  # [batch, num_patterns]
        
        # Soft pattern matching
        pattern_weights = F.softmax(similarities / 0.1, dim=-1)
        
        # Disease risk from patterns
        disease_risks = torch.sigmoid(self.pattern_classifier(pattern_weights))
        
        # Time to onset prediction
        temporal_input = torch.cat([embedding, pattern_weights], dim=-1)
        time_probs = F.softmax(self.temporal_predictor(temporal_input), dim=-1)
        
        return {
            'pattern_similarities': similarities,
            'pattern_weights': pattern_weights,
            'disease_risks': disease_risks,
            'time_to_onset_distribution': time_probs
        }


# ============================================
# Complete Encoder System
# ============================================

class ManpasikSignalIntelligence(nn.Module):
    """
    Complete system combining:
    - Raw Signal Encoder
    - Combinatorial Analyzer
    - Pattern Matcher
    
    The full "Butterfly Effect" detector.
    """
    
    def __init__(self, config: RawSignalConfig):
        super().__init__()
        
        self.encoder = ManpasikRawSignalEncoder(config)
        self.analyzer = CombinatorialAnalyzer(config)
        self.pattern_matcher = PatternMatcher(config)
        
        # Contrastive loss for training
        self.contrastive_loss = NTXentLoss(config.temperature)
    
    def forward(self, signal: RawSignalTensor) -> Dict[str, any]:
        # Encode raw signals
        encoded = self.encoder(signal)
        
        # Analyze combinations
        modality_embeddings = [
            encoded.cv_embedding,
            encoded.eis_embedding,
            encoded.swv_embedding,
            encoded.dpv_embedding
        ]
        combinatorial = self.analyzer(modality_embeddings, encoded.embedding)
        
        # Match patterns
        patterns = self.pattern_matcher(encoded.embedding)
        
        return {
            'embedding': encoded.embedding,
            'micro_anomalies': encoded.micro_anomalies,
            'attention_weights': encoded.attention_weights,
            'conditions': combinatorial['conditions'],
            'treatments': combinatorial['treatments'],
            'disease_risks': patterns['disease_risks'],
            'time_to_onset': patterns['time_to_onset_distribution'],
            'pattern_matches': patterns['pattern_similarities']
        }
    
    def compute_contrastive_loss(
        self, 
        signal1: RawSignalTensor, 
        signal2: RawSignalTensor
    ) -> torch.Tensor:
        """Compute contrastive loss for two augmented views."""
        z1 = self.encoder.get_contrastive_embedding(signal1)
        z2 = self.encoder.get_contrastive_embedding(signal2)
        return self.contrastive_loss(z1, z2)


# ============================================
# Inference API
# ============================================

class SignalIntelligencePredictor:
    """High-level API for signal analysis"""
    
    def __init__(self, model_path: str, config: RawSignalConfig):
        self.config = config
        self.model = ManpasikSignalIntelligence(config)
        # self.model.load_state_dict(torch.load(model_path))
        self.model.eval()
    
    @torch.no_grad()
    def analyze(self, raw_signal: Dict) -> Dict:
        """
        Analyze a raw signal and return insights.
        
        Args:
            raw_signal: Dict with keys: cv_curve, eis_real, eis_imag, 
                       swv_response, dpv_response, env_context
        
        Returns:
            Complete analysis with conditions, risks, and recommendations
        """
        # Convert to tensor
        signal = RawSignalTensor(
            cv_curve=torch.tensor(raw_signal['cv_curve']).float().unsqueeze(0),
            eis_real=torch.tensor(raw_signal['eis_real']).float().unsqueeze(0),
            eis_imag=torch.tensor(raw_signal['eis_imag']).float().unsqueeze(0),
            swv_response=torch.tensor(raw_signal['swv_response']).float().unsqueeze(0),
            dpv_response=torch.tensor(raw_signal['dpv_response']).float().unsqueeze(0),
            env_context=torch.tensor(raw_signal['env_context']).float().unsqueeze(0),
            genotype=torch.tensor(raw_signal.get('genotype', [0]*32)).float().unsqueeze(0)
        )
        
        # Run model
        output = self.model(signal)
        
        # Convert to interpretable format
        return {
            'embedding': output['embedding'].numpy().tolist(),
            'micro_anomalies': {
                k: v.numpy().tolist() for k, v in output['micro_anomalies'].items()
            },
            'top_conditions': self._get_top_k(output['conditions'], k=5),
            'top_treatments': self._get_top_k(output['treatments'], k=5),
            'disease_risks': self._get_top_k(output['disease_risks'], k=5),
            'time_to_onset_days': self._get_expected_time(output['time_to_onset'])
        }
    
    def _get_top_k(self, probs: torch.Tensor, k: int = 5) -> List[Dict]:
        """Get top-k predictions with probabilities"""
        probs = probs.squeeze(0)
        values, indices = torch.topk(probs, k)
        return [
            {'index': int(idx), 'probability': float(val)}
            for idx, val in zip(indices, values)
        ]
    
    def _get_expected_time(self, time_dist: torch.Tensor) -> float:
        """Get expected time to onset from distribution"""
        time_dist = time_dist.squeeze(0)
        days = torch.arange(len(time_dist), dtype=torch.float)
        expected = (days * time_dist).sum()
        return float(expected) * 7  # Convert to actual days (7-day buckets)


# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    config = RawSignalConfig()
    
    print("Manpasik Raw Signal Encoder")
    print("=" * 50)
    print(f"CV Curve Points: {config.cv_dim}")
    print(f"EIS Spectrum Points: {config.eis_real_dim + config.eis_imag_dim}")
    print(f"SWV Points: {config.swv_dim}")
    print(f"DPV Points: {config.dpv_dim}")
    print(f"Hidden Dimension: {config.hidden_dim}")
    print(f"Latent Dimension: {config.latent_dim}")
    
    # Initialize model
    model = ManpasikSignalIntelligence(config)
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    print(f"\nTotal Parameters: {total_params:,}")
    
    # Test forward pass
    batch_size = 4
    dummy_signal = RawSignalTensor(
        cv_curve=torch.randn(batch_size, config.cv_dim),
        eis_real=torch.randn(batch_size, config.eis_real_dim),
        eis_imag=torch.randn(batch_size, config.eis_imag_dim),
        swv_response=torch.randn(batch_size, config.swv_dim),
        dpv_response=torch.randn(batch_size, config.dpv_dim),
        env_context=torch.randn(batch_size, config.env_dim),
        genotype=torch.randn(batch_size, config.genotype_dim)
    )
    
    output = model(dummy_signal)
    print(f"\nOutput embedding shape: {output['embedding'].shape}")
    print(f"Disease risks shape: {output['disease_risks'].shape}")
    print(f"Micro-anomalies: {list(output['micro_anomalies'].keys())}")







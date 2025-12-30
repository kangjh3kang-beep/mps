"""
Manpasik Transfer Learning Pipeline
=====================================

Uses pre-trained external models (BioBERT) to boost the Manpasik Brain.

Architecture:
- Base Model: BioBERT (Pre-trained on millions of medical papers)
- Fine-Tuning: Train on Manpasik Coaching_Logs and Sensor_Interpretations
- Result: AI that speaks like a medical professor (BioBERT) but knows 
          the user's body intimately (Manpasik)

Philosophy: "Domain Adaptation - General Rule + Personal Exception"
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from typing import List, Dict, Optional, Tuple
import numpy as np
from dataclasses import dataclass, field
from enum import Enum
import json


# ============================================
# Configuration
# ============================================

@dataclass
class TransferLearningConfig:
    """Configuration for transfer learning"""
    
    # Base model
    base_model_name: str = "dmis-lab/biobert-v1.1"
    
    # Architecture
    hidden_dim: int = 768          # BioBERT hidden size
    num_labels: int = 50           # Number of coaching categories
    dropout: float = 0.1
    
    # Fine-tuning strategy
    freeze_layers: int = 10        # Freeze first N transformer layers
    learning_rate_base: float = 1e-5
    learning_rate_head: float = 1e-4
    
    # Training
    batch_size: int = 16
    max_epochs: int = 10
    warmup_steps: int = 500
    max_seq_length: int = 512
    
    # Chemical inverse-inference
    spectral_dim: int = 2048       # MassSpec spectral dimension
    cv_dim: int = 200              # CV curve dimension


# ============================================
# Data Structures
# ============================================

@dataclass
class CoachingLogEntry:
    """A single coaching interaction from Manpasik logs"""
    id: str
    user_id: str
    timestamp: str
    
    # Sensor context
    sensor_summary: str            # "Lactate: 2.8 mmol/L (elevated)"
    raw_features: List[float]      # 88-dim vector
    
    # Coaching interaction
    user_query: str                # "Why am I so tired?"
    ai_response: str               # "Based on your lactate levels..."
    
    # Labels
    category: str                  # "fatigue_analysis"
    sentiment: str                 # "empathetic"
    action_items: List[str]        # ["rest", "hydrate"]
    
    # Feedback
    user_rating: Optional[int] = None  # 1-5
    was_helpful: Optional[bool] = None


@dataclass
class SensorInterpretation:
    """Interpretation of sensor data for training"""
    id: str
    
    # Raw sensor data
    cv_curve: List[float]
    eis_spectrum: List[float]
    swv_response: List[float]
    
    # Feature summary
    feature_vector: List[float]    # 88-dim
    
    # Expert interpretation
    interpretation: str            # "Elevated lactate with normal glucose..."
    clinical_significance: str     # "Indicates metabolic stress"
    recommended_action: str        # "Rest and hydration recommended"
    
    # Verified outcome (for training)
    verified_condition: Optional[str] = None


# ============================================
# BioBERT-based Coaching Model
# ============================================

class BioBERTCoachingHead(nn.Module):
    """
    Custom head for Manpasik coaching on top of BioBERT.
    
    Combines text understanding with sensor context.
    """
    
    def __init__(self, config: TransferLearningConfig):
        super().__init__()
        self.config = config
        
        # Sensor context encoder
        self.sensor_encoder = nn.Sequential(
            nn.Linear(88, 256),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(256, config.hidden_dim)
        )
        
        # Fusion layer (text + sensor)
        self.fusion = nn.Sequential(
            nn.Linear(config.hidden_dim * 2, config.hidden_dim),
            nn.LayerNorm(config.hidden_dim),
            nn.ReLU(),
            nn.Dropout(config.dropout)
        )
        
        # Classification head
        self.classifier = nn.Linear(config.hidden_dim, config.num_labels)
        
        # Response generation head
        self.response_generator = nn.Sequential(
            nn.Linear(config.hidden_dim, config.hidden_dim * 2),
            nn.ReLU(),
            nn.Linear(config.hidden_dim * 2, config.hidden_dim)
        )
    
    def forward(
        self,
        text_embedding: torch.Tensor,    # [batch, hidden_dim] from BioBERT
        sensor_features: torch.Tensor     # [batch, 88]
    ) -> Dict[str, torch.Tensor]:
        # Encode sensor context
        sensor_embedding = self.sensor_encoder(sensor_features)
        
        # Fuse text and sensor
        combined = torch.cat([text_embedding, sensor_embedding], dim=-1)
        fused = self.fusion(combined)
        
        # Classification
        logits = self.classifier(fused)
        
        # Response embedding
        response_embedding = self.response_generator(fused)
        
        return {
            "logits": logits,
            "fused_embedding": fused,
            "response_embedding": response_embedding
        }


class ManpasikBioBERT(nn.Module):
    """
    BioBERT fine-tuned for Manpasik coaching.
    
    Speaks like a medical professor (BioBERT) but knows
    the user's body intimately (Manpasik fine-tuning).
    """
    
    def __init__(self, config: TransferLearningConfig):
        super().__init__()
        self.config = config
        
        # In production, load actual BioBERT
        # from transformers import AutoModel
        # self.biobert = AutoModel.from_pretrained(config.base_model_name)
        
        # For demo, use a mock transformer encoder
        self.embedding = nn.Embedding(30522, config.hidden_dim)  # Vocab size
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=config.hidden_dim,
            nhead=12,
            dim_feedforward=config.hidden_dim * 4,
            dropout=config.dropout,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=12)
        
        # Manpasik coaching head
        self.coaching_head = BioBERTCoachingHead(config)
        
        # Freeze lower layers
        self._freeze_layers(config.freeze_layers)
    
    def _freeze_layers(self, n_layers: int):
        """Freeze the first N transformer layers"""
        # In production with actual BioBERT:
        # for i, layer in enumerate(self.biobert.encoder.layer[:n_layers]):
        #     for param in layer.parameters():
        #         param.requires_grad = False
        pass
    
    def forward(
        self,
        input_ids: torch.Tensor,         # [batch, seq_len]
        attention_mask: torch.Tensor,     # [batch, seq_len]
        sensor_features: torch.Tensor     # [batch, 88]
    ) -> Dict[str, torch.Tensor]:
        # Get text embedding from BioBERT
        embedded = self.embedding(input_ids)
        
        # Create attention mask for transformer
        mask = attention_mask == 0  # True where to mask
        
        # Pass through transformer
        hidden_states = self.transformer(embedded, src_key_padding_mask=mask)
        
        # Pool to single vector (CLS token or mean)
        pooled = hidden_states[:, 0, :]  # CLS token
        
        # Pass through coaching head
        outputs = self.coaching_head(pooled, sensor_features)
        
        return outputs
    
    def generate_response(
        self,
        query: str,
        sensor_features: torch.Tensor,
        max_length: int = 200
    ) -> str:
        """Generate a coaching response"""
        # In production, use proper tokenizer and generation
        # This is a simplified placeholder
        
        self.eval()
        with torch.no_grad():
            # Mock tokenization
            input_ids = torch.randint(0, 30000, (1, 50))
            attention_mask = torch.ones_like(input_ids)
            
            outputs = self.forward(input_ids, attention_mask, sensor_features)
            
            # Get category from logits
            category_idx = outputs["logits"].argmax(dim=-1).item()
            
            # Generate response based on category and sensor features
            response = self._format_response(category_idx, sensor_features)
        
        return response
    
    def _format_response(self, category_idx: int, sensor_features: torch.Tensor) -> str:
        """Format a response based on category and sensor data"""
        categories = [
            "fatigue_analysis",
            "glucose_management", 
            "hydration_advice",
            "sleep_coaching",
            "exercise_recommendation"
        ]
        
        category = categories[category_idx % len(categories)]
        lactate = sensor_features[0, 0].item() * 5  # Mock extraction
        
        responses = {
            "fatigue_analysis": f"Based on your lactate level of {lactate:.1f} mmol/L, I can see why you're feeling tired. Your body is showing signs of metabolic stress. I recommend a 20-minute rest period and increased hydration.",
            "glucose_management": f"Your glucose patterns suggest some variability. Consider having a fiber-rich snack to stabilize your levels.",
            "hydration_advice": "Your biomarkers indicate mild dehydration. Try to drink at least 500ml of water in the next hour.",
            "sleep_coaching": "Your recovery metrics suggest you might benefit from an earlier bedtime tonight.",
            "exercise_recommendation": "Based on your current lactate clearance rate, light activity like walking would be beneficial."
        }
        
        return responses.get(category, "Let me analyze your data further.")


# ============================================
# Chemical Structure Inverse-Inference
# ============================================

class SpectralMatcher(nn.Module):
    """
    Maps Manpasik CV Curves to MassSpec Spectra from external DBs.
    
    Benefit: Even if the cartridge hasn't seen a specific toxin before,
    it can guess its identity by comparing to external chemical libraries.
    """
    
    def __init__(self, config: TransferLearningConfig):
        super().__init__()
        self.config = config
        
        # CV curve encoder
        self.cv_encoder = nn.Sequential(
            nn.Conv1d(1, 64, kernel_size=7, padding=3),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(64, 128, kernel_size=5, padding=2),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten(),
            nn.Linear(256, config.hidden_dim)
        )
        
        # Mass spec encoder (for training alignment)
        self.massspec_encoder = nn.Sequential(
            nn.Linear(config.spectral_dim, config.hidden_dim),
            nn.ReLU(),
            nn.Linear(config.hidden_dim, config.hidden_dim)
        )
        
        # Shared latent space projection
        self.cv_projector = nn.Linear(config.hidden_dim, 256)
        self.massspec_projector = nn.Linear(config.hidden_dim, 256)
        
        # Compound classifier (optional supervised head)
        self.classifier = nn.Linear(256, 1000)  # 1000 known compounds
    
    def encode_cv(self, cv_curve: torch.Tensor) -> torch.Tensor:
        """Encode a CV curve to latent space"""
        x = cv_curve.unsqueeze(1)  # Add channel dim
        embedded = self.cv_encoder(x)
        projected = F.normalize(self.cv_projector(embedded), dim=-1)
        return projected
    
    def encode_massspec(self, spectrum: torch.Tensor) -> torch.Tensor:
        """Encode a mass spectrum to latent space"""
        embedded = self.massspec_encoder(spectrum)
        projected = F.normalize(self.massspec_projector(embedded), dim=-1)
        return projected
    
    def forward(
        self,
        cv_curve: torch.Tensor,
        massspec: Optional[torch.Tensor] = None
    ) -> Dict[str, torch.Tensor]:
        cv_embedding = self.encode_cv(cv_curve)
        
        outputs = {
            "cv_embedding": cv_embedding,
            "compound_logits": self.classifier(cv_embedding)
        }
        
        if massspec is not None:
            massspec_embedding = self.encode_massspec(massspec)
            outputs["massspec_embedding"] = massspec_embedding
            
            # Contrastive similarity
            similarity = torch.mm(cv_embedding, massspec_embedding.t())
            outputs["similarity"] = similarity
        
        return outputs
    
    def match_to_library(
        self,
        cv_curve: torch.Tensor,
        library_embeddings: torch.Tensor,
        library_names: List[str],
        top_k: int = 5
    ) -> List[Dict]:
        """Match a CV curve against a library of known compounds"""
        self.eval()
        with torch.no_grad():
            cv_embedding = self.encode_cv(cv_curve.unsqueeze(0))
            
            # Cosine similarity
            similarities = torch.mm(cv_embedding, library_embeddings.t())[0]
            
            # Top-k matches
            values, indices = torch.topk(similarities, top_k)
            
            matches = []
            for val, idx in zip(values, indices):
                matches.append({
                    "compound": library_names[idx],
                    "similarity": val.item(),
                    "confidence": "high" if val > 0.8 else "medium" if val > 0.5 else "low"
                })
            
            return matches


# ============================================
# Training Pipeline
# ============================================

class ManpasikDataset(Dataset):
    """Dataset for fine-tuning on Manpasik data"""
    
    def __init__(
        self,
        coaching_logs: List[CoachingLogEntry],
        max_length: int = 512
    ):
        self.logs = coaching_logs
        self.max_length = max_length
        
        # Build label mapping
        self.label_to_idx = {}
        for log in coaching_logs:
            if log.category not in self.label_to_idx:
                self.label_to_idx[log.category] = len(self.label_to_idx)
    
    def __len__(self):
        return len(self.logs)
    
    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        log = self.logs[idx]
        
        # Mock tokenization (use actual tokenizer in production)
        text = f"Query: {log.user_query} Context: {log.sensor_summary}"
        input_ids = torch.randint(0, 30000, (min(len(text.split()), self.max_length),))
        
        # Pad to max length
        if len(input_ids) < self.max_length:
            padding = torch.zeros(self.max_length - len(input_ids), dtype=torch.long)
            input_ids = torch.cat([input_ids, padding])
        
        attention_mask = (input_ids != 0).long()
        
        # Sensor features
        sensor_features = torch.tensor(log.raw_features[:88], dtype=torch.float32)
        if len(sensor_features) < 88:
            padding = torch.zeros(88 - len(sensor_features))
            sensor_features = torch.cat([sensor_features, padding])
        
        # Label
        label = self.label_to_idx.get(log.category, 0)
        
        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "sensor_features": sensor_features,
            "label": torch.tensor(label)
        }


def train_manpasik_biobert(
    config: TransferLearningConfig,
    train_data: List[CoachingLogEntry],
    val_data: List[CoachingLogEntry],
    output_dir: str
) -> ManpasikBioBERT:
    """
    Fine-tune BioBERT on Manpasik coaching data.
    """
    # Initialize model
    model = ManpasikBioBERT(config)
    
    # Prepare datasets
    train_dataset = ManpasikDataset(train_data, config.max_seq_length)
    val_dataset = ManpasikDataset(val_data, config.max_seq_length)
    
    train_loader = DataLoader(train_dataset, batch_size=config.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=config.batch_size)
    
    # Optimizer with different learning rates
    optimizer = torch.optim.AdamW([
        {"params": model.transformer.parameters(), "lr": config.learning_rate_base},
        {"params": model.coaching_head.parameters(), "lr": config.learning_rate_head}
    ])
    
    # Loss function
    criterion = nn.CrossEntropyLoss()
    
    # Training loop
    for epoch in range(config.max_epochs):
        model.train()
        total_loss = 0
        
        for batch in train_loader:
            optimizer.zero_grad()
            
            outputs = model(
                batch["input_ids"],
                batch["attention_mask"],
                batch["sensor_features"]
            )
            
            loss = criterion(outputs["logits"], batch["label"])
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
        
        avg_loss = total_loss / len(train_loader)
        
        # Validation
        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for batch in val_loader:
                outputs = model(
                    batch["input_ids"],
                    batch["attention_mask"],
                    batch["sensor_features"]
                )
                preds = outputs["logits"].argmax(dim=-1)
                correct += (preds == batch["label"]).sum().item()
                total += batch["label"].size(0)
        
        accuracy = correct / total if total > 0 else 0
        print(f"Epoch {epoch + 1}/{config.max_epochs}: Loss = {avg_loss:.4f}, Val Acc = {accuracy:.2%}")
    
    # Save model
    torch.save(model.state_dict(), f"{output_dir}/manpasik_biobert.pt")
    
    return model


def train_spectral_matcher(
    config: TransferLearningConfig,
    cv_curves: torch.Tensor,
    massspec: torch.Tensor,
    pairs: List[Tuple[int, int]],  # (cv_idx, massspec_idx) positive pairs
    output_dir: str
) -> SpectralMatcher:
    """
    Train the spectral matcher using contrastive learning.
    """
    model = SpectralMatcher(config)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    
    # Contrastive loss (InfoNCE)
    temperature = 0.07
    
    for epoch in range(50):
        model.train()
        total_loss = 0
        
        for cv_idx, ms_idx in pairs:
            optimizer.zero_grad()
            
            cv_batch = cv_curves[cv_idx:cv_idx+1]
            ms_batch = massspec[ms_idx:ms_idx+1]
            
            outputs = model(cv_batch, ms_batch)
            
            # Contrastive loss
            cv_emb = outputs["cv_embedding"]
            ms_emb = outputs["massspec_embedding"]
            
            similarity = torch.mm(cv_emb, ms_emb.t()) / temperature
            labels = torch.arange(cv_emb.size(0))
            
            loss = F.cross_entropy(similarity, labels)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
        
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch + 1}/50: Loss = {total_loss / len(pairs):.4f}")
    
    torch.save(model.state_dict(), f"{output_dir}/spectral_matcher.pt")
    
    return model


# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    config = TransferLearningConfig()
    
    print("Manpasik Transfer Learning Pipeline")
    print("=" * 50)
    print(f"Base Model: {config.base_model_name}")
    print(f"Hidden Dim: {config.hidden_dim}")
    print(f"Frozen Layers: {config.freeze_layers}")
    
    # Initialize model
    model = ManpasikBioBERT(config)
    
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    print(f"\nTotal Parameters: {total_params:,}")
    print(f"Trainable Parameters: {trainable_params:,}")
    
    # Test inference
    sensor_features = torch.randn(1, 88)
    response = model.generate_response("Why am I tired?", sensor_features)
    print(f"\nSample Response: {response}")
    
    # Test spectral matcher
    matcher = SpectralMatcher(config)
    cv_curve = torch.randn(200)  # Example CV curve
    
    # Mock library
    library_embeddings = torch.randn(100, 256)
    library_embeddings = F.normalize(library_embeddings, dim=-1)
    library_names = [f"Compound_{i}" for i in range(100)]
    
    matches = matcher.match_to_library(cv_curve, library_embeddings, library_names)
    print(f"\nTop Matches: {matches[:3]}")







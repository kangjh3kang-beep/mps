"""
Manpasik Prescription Engine (RL-based)
========================================

A Reinforcement Learning agent that learns to prescribe optimal
interventions (nutrients, exercise, sleep patterns) based on
bio-signal patterns.

Reward: Improvement in next measurement's "Signal Purity" + 
        User's "Subjective Condition"

Philosophy: "Your unique Lactate Recovery Curve tells us you respond
            better to Yoga than HIIT. Changing recommendation."
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Categorical
from typing import List, Dict, Tuple, Optional
import numpy as np
from dataclasses import dataclass, field
from enum import Enum
from collections import deque
import random


# ============================================
# Configuration
# ============================================

@dataclass
class RLConfig:
    """Configuration for RL Prescription Engine"""
    
    # State dimensions
    signal_dim: int = 256        # Encoded signal embedding
    history_length: int = 7      # Days of history to consider
    user_profile_dim: int = 64   # User demographics/goals
    
    # Action space
    num_nutrients: int = 50      # Supplement types
    num_exercises: int = 20      # Exercise types
    num_sleep_patterns: int = 10 # Sleep recommendations
    num_lifestyle: int = 30      # Other lifestyle changes
    
    # Model
    hidden_dim: int = 512
    num_attention_heads: int = 8
    dropout: float = 0.1
    
    # Training
    batch_size: int = 32
    learning_rate: float = 3e-4
    gamma: float = 0.99          # Discount factor
    tau: float = 0.005           # Soft update coefficient
    
    # Reward weights
    signal_improvement_weight: float = 0.6
    subjective_condition_weight: float = 0.3
    adherence_bonus_weight: float = 0.1
    
    # Exploration
    epsilon_start: float = 1.0
    epsilon_end: float = 0.01
    epsilon_decay: float = 0.995
    
    # Memory
    memory_size: int = 100000


# ============================================
# Action Space Definitions
# ============================================

class ActionType(Enum):
    NUTRIENT = "nutrient"
    EXERCISE = "exercise"
    SLEEP = "sleep"
    LIFESTYLE = "lifestyle"


@dataclass
class Action:
    """A prescription action"""
    action_type: ActionType
    action_id: int
    
    # Action details
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    timing: Optional[str] = None
    
    # Confidence and reasoning
    confidence: float = 0.0
    reasoning: str = ""


# Predefined action catalogs
NUTRIENT_CATALOG = {
    0: ("Magnesium Glycinate", "300mg", "daily", "before_bed"),
    1: ("Zinc Chelate", "15mg", "daily", "with_meal"),
    2: ("Omega-3 EPA/DHA", "1000mg", "daily", "with_meal"),
    3: ("Vitamin D3", "2000IU", "daily", "morning"),
    4: ("Vitamin B Complex", "1 tablet", "daily", "morning"),
    5: ("Coenzyme Q10", "100mg", "daily", "with_meal"),
    6: ("Probiotics", "10B CFU", "daily", "empty_stomach"),
    7: ("Iron Bisglycinate", "25mg", "daily", "empty_stomach"),
    8: ("Curcumin", "500mg", "twice_daily", "with_meal"),
    9: ("Ashwagandha", "300mg", "twice_daily", "any_time"),
    # ... more nutrients
}

EXERCISE_CATALOG = {
    0: ("Yoga", "30min", "daily"),
    1: ("HIIT", "20min", "3x_week"),
    2: ("Walking", "45min", "daily"),
    3: ("Swimming", "30min", "3x_week"),
    4: ("Strength Training", "45min", "3x_week"),
    5: ("Cycling", "30min", "daily"),
    6: ("Stretching", "15min", "daily"),
    7: ("Meditation", "20min", "daily"),
    # ... more exercises
}


# ============================================
# State Representation
# ============================================

@dataclass
class State:
    """RL State containing all relevant information"""
    
    # Current signal embedding
    current_signal: torch.Tensor      # [signal_dim]
    
    # Signal history (last N days)
    signal_history: torch.Tensor      # [history_length, signal_dim]
    
    # User profile
    user_profile: torch.Tensor        # [user_profile_dim]
    
    # Current health metrics
    health_score: float
    biomarkers: Dict[str, float]
    
    # Previous actions and their outcomes
    action_history: List[Tuple[Action, float]]  # [(action, reward), ...]
    
    # Contextual info
    time_of_day: int                  # 0-23
    day_of_week: int                  # 0-6
    season: int                       # 0-3


@dataclass
class Transition:
    """A single transition for experience replay"""
    state: State
    action: int
    reward: float
    next_state: State
    done: bool


# ============================================
# Reward Function
# ============================================

class RewardCalculator:
    """
    Computes reward for RL training.
    
    Primary: Improvement in bio-signal quality
    Secondary: User's subjective condition improvement
    Bonus: Adherence to previous recommendations
    """
    
    def __init__(self, config: RLConfig):
        self.config = config
    
    def compute(
        self,
        prev_state: State,
        curr_state: State,
        action: Action,
        adherence: float
    ) -> Dict[str, float]:
        """
        Compute reward components.
        
        Args:
            prev_state: State before action
            curr_state: State after action (next measurement)
            action: The action taken
            adherence: How well user followed the recommendation (0-1)
        
        Returns:
            Dictionary of reward components and total reward
        """
        
        # 1. Signal improvement (objective)
        signal_improvement = self._compute_signal_improvement(prev_state, curr_state)
        
        # 2. Subjective condition (from user survey)
        subjective_improvement = self._compute_subjective_improvement(prev_state, curr_state)
        
        # 3. Adherence bonus
        adherence_bonus = adherence * 0.2  # Max 0.2 bonus for perfect adherence
        
        # Weighted combination
        total_reward = (
            self.config.signal_improvement_weight * signal_improvement +
            self.config.subjective_condition_weight * subjective_improvement +
            self.config.adherence_bonus_weight * adherence_bonus
        )
        
        return {
            "signal_improvement": signal_improvement,
            "subjective_improvement": subjective_improvement,
            "adherence_bonus": adherence_bonus,
            "total": total_reward
        }
    
    def _compute_signal_improvement(self, prev: State, curr: State) -> float:
        """Compute signal quality improvement"""
        # Health score delta
        health_delta = curr.health_score - prev.health_score
        
        # Normalize to [-1, 1]
        normalized = np.tanh(health_delta / 10)
        
        return normalized
    
    def _compute_subjective_improvement(self, prev: State, curr: State) -> float:
        """Compute subjective condition improvement from surveys"""
        # Compare biomarker-derived subjective scores
        prev_score = prev.biomarkers.get("subjective_wellbeing", 50)
        curr_score = curr.biomarkers.get("subjective_wellbeing", 50)
        
        delta = curr_score - prev_score
        normalized = np.tanh(delta / 20)
        
        return normalized


# ============================================
# Neural Network Architecture
# ============================================

class StateEncoder(nn.Module):
    """Encodes the RL state into a fixed-size vector"""
    
    def __init__(self, config: RLConfig):
        super().__init__()
        self.config = config
        
        # Current signal encoder
        self.signal_encoder = nn.Sequential(
            nn.Linear(config.signal_dim, config.hidden_dim),
            nn.ReLU(),
            nn.Linear(config.hidden_dim, config.hidden_dim // 2)
        )
        
        # History encoder (LSTM)
        self.history_encoder = nn.LSTM(
            input_size=config.signal_dim,
            hidden_size=config.hidden_dim // 2,
            num_layers=2,
            batch_first=True,
            dropout=config.dropout
        )
        
        # User profile encoder
        self.profile_encoder = nn.Sequential(
            nn.Linear(config.user_profile_dim, config.hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(config.hidden_dim // 2, config.hidden_dim // 4)
        )
        
        # Context encoder (time, day, season)
        self.context_encoder = nn.Sequential(
            nn.Linear(3, 32),
            nn.ReLU(),
            nn.Linear(32, 32)
        )
        
        # Fusion
        fusion_dim = config.hidden_dim // 2 + config.hidden_dim // 2 + config.hidden_dim // 4 + 32
        self.fusion = nn.Sequential(
            nn.Linear(fusion_dim, config.hidden_dim),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_dim, config.hidden_dim)
        )
    
    def forward(self, state: State) -> torch.Tensor:
        # Encode current signal
        signal_enc = self.signal_encoder(state.current_signal)
        
        # Encode history
        history_out, (h_n, c_n) = self.history_encoder(state.signal_history.unsqueeze(0))
        history_enc = h_n[-1].squeeze(0)
        
        # Encode profile
        profile_enc = self.profile_encoder(state.user_profile)
        
        # Encode context
        context = torch.tensor([
            state.time_of_day / 24.0,
            state.day_of_week / 7.0,
            state.season / 4.0
        ], dtype=torch.float32)
        context_enc = self.context_encoder(context)
        
        # Fuse all
        combined = torch.cat([signal_enc, history_enc, profile_enc, context_enc], dim=-1)
        state_encoding = self.fusion(combined)
        
        return state_encoding


class Actor(nn.Module):
    """Policy network that selects actions"""
    
    def __init__(self, config: RLConfig):
        super().__init__()
        self.config = config
        
        # Total action space size
        self.total_actions = (
            config.num_nutrients + 
            config.num_exercises + 
            config.num_sleep_patterns + 
            config.num_lifestyle
        )
        
        # Policy head
        self.policy = nn.Sequential(
            nn.Linear(config.hidden_dim, config.hidden_dim),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_dim, self.total_actions)
        )
    
    def forward(self, state_encoding: torch.Tensor) -> torch.Tensor:
        """Returns action probabilities"""
        logits = self.policy(state_encoding)
        probs = F.softmax(logits, dim=-1)
        return probs
    
    def get_action(
        self, 
        state_encoding: torch.Tensor, 
        epsilon: float = 0.0
    ) -> Tuple[int, float]:
        """Sample an action with epsilon-greedy exploration"""
        if random.random() < epsilon:
            # Random exploration
            action = random.randint(0, self.total_actions - 1)
            return action, 1.0 / self.total_actions
        
        probs = self.forward(state_encoding)
        dist = Categorical(probs)
        action = dist.sample()
        
        return action.item(), probs[action].item()


class Critic(nn.Module):
    """Value network that estimates state value"""
    
    def __init__(self, config: RLConfig):
        super().__init__()
        
        self.value = nn.Sequential(
            nn.Linear(config.hidden_dim, config.hidden_dim),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_dim, 1)
        )
    
    def forward(self, state_encoding: torch.Tensor) -> torch.Tensor:
        """Returns state value estimate"""
        return self.value(state_encoding)


class QNetwork(nn.Module):
    """Q-Network for DQN-style learning"""
    
    def __init__(self, config: RLConfig):
        super().__init__()
        self.config = config
        
        self.total_actions = (
            config.num_nutrients + 
            config.num_exercises + 
            config.num_sleep_patterns + 
            config.num_lifestyle
        )
        
        # Q-value head
        self.q_values = nn.Sequential(
            nn.Linear(config.hidden_dim, config.hidden_dim),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_dim, config.hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(config.hidden_dim // 2, self.total_actions)
        )
    
    def forward(self, state_encoding: torch.Tensor) -> torch.Tensor:
        """Returns Q-values for all actions"""
        return self.q_values(state_encoding)


# ============================================
# Experience Replay
# ============================================

class ReplayMemory:
    """Experience replay buffer"""
    
    def __init__(self, capacity: int):
        self.memory = deque(maxlen=capacity)
    
    def push(self, transition: Transition):
        self.memory.append(transition)
    
    def sample(self, batch_size: int) -> List[Transition]:
        return random.sample(self.memory, batch_size)
    
    def __len__(self):
        return len(self.memory)


class PrioritizedReplayMemory:
    """Prioritized experience replay for more efficient learning"""
    
    def __init__(self, capacity: int, alpha: float = 0.6):
        self.capacity = capacity
        self.alpha = alpha
        self.memory = []
        self.priorities = []
        self.position = 0
    
    def push(self, transition: Transition, priority: float = 1.0):
        if len(self.memory) < self.capacity:
            self.memory.append(transition)
            self.priorities.append(priority ** self.alpha)
        else:
            self.memory[self.position] = transition
            self.priorities[self.position] = priority ** self.alpha
        self.position = (self.position + 1) % self.capacity
    
    def sample(self, batch_size: int, beta: float = 0.4) -> Tuple[List[Transition], np.ndarray, np.ndarray]:
        priorities = np.array(self.priorities)
        probabilities = priorities / priorities.sum()
        
        indices = np.random.choice(len(self.memory), batch_size, p=probabilities)
        samples = [self.memory[i] for i in indices]
        
        # Importance sampling weights
        weights = (len(self.memory) * probabilities[indices]) ** (-beta)
        weights /= weights.max()
        
        return samples, indices, weights
    
    def update_priorities(self, indices: np.ndarray, priorities: np.ndarray):
        for idx, priority in zip(indices, priorities):
            self.priorities[idx] = priority ** self.alpha


# ============================================
# Main RL Agent
# ============================================

class PrescriptionAgent:
    """
    The Hyper-Personalized Prescription Engine.
    
    Uses Deep Q-Learning with experience replay to learn
    optimal interventions for each user's unique bio-signature.
    """
    
    def __init__(self, config: RLConfig):
        self.config = config
        
        # Networks
        self.state_encoder = StateEncoder(config)
        self.q_network = QNetwork(config)
        self.target_network = QNetwork(config)
        
        # Copy weights to target
        self.target_network.load_state_dict(self.q_network.state_dict())
        
        # Optimizer
        self.optimizer = torch.optim.Adam(
            list(self.state_encoder.parameters()) + 
            list(self.q_network.parameters()),
            lr=config.learning_rate
        )
        
        # Memory
        self.memory = PrioritizedReplayMemory(config.memory_size)
        
        # Reward calculator
        self.reward_calculator = RewardCalculator(config)
        
        # Exploration
        self.epsilon = config.epsilon_start
        
        # Action space boundaries
        self.action_boundaries = [
            (0, config.num_nutrients),
            (config.num_nutrients, config.num_nutrients + config.num_exercises),
            (config.num_nutrients + config.num_exercises,
             config.num_nutrients + config.num_exercises + config.num_sleep_patterns),
            (config.num_nutrients + config.num_exercises + config.num_sleep_patterns,
             config.num_nutrients + config.num_exercises + config.num_sleep_patterns + config.num_lifestyle)
        ]
    
    def select_action(self, state: State) -> Action:
        """Select an action for the given state"""
        
        # Encode state
        state_encoding = self.state_encoder(state)
        
        # Get Q-values
        with torch.no_grad():
            q_values = self.q_network(state_encoding)
        
        # Epsilon-greedy
        if random.random() < self.epsilon:
            action_idx = random.randint(0, q_values.size(-1) - 1)
        else:
            action_idx = q_values.argmax().item()
        
        # Convert to Action object
        action = self._idx_to_action(action_idx, q_values[action_idx].item())
        
        return action
    
    def _idx_to_action(self, idx: int, confidence: float) -> Action:
        """Convert action index to Action object"""
        
        # Determine action type
        for i, (start, end) in enumerate(self.action_boundaries):
            if start <= idx < end:
                action_type = list(ActionType)[i]
                local_idx = idx - start
                break
        
        # Get action details from catalog
        if action_type == ActionType.NUTRIENT:
            if local_idx in NUTRIENT_CATALOG:
                name, dosage, freq, timing = NUTRIENT_CATALOG[local_idx]
            else:
                name, dosage, freq, timing = f"Nutrient_{local_idx}", "standard", "daily", "any"
        elif action_type == ActionType.EXERCISE:
            if local_idx in EXERCISE_CATALOG:
                name, duration, freq = EXERCISE_CATALOG[local_idx]
                dosage, timing = duration, None
            else:
                name, dosage, freq, timing = f"Exercise_{local_idx}", "30min", "daily", None
        else:
            name = f"{action_type.value}_{local_idx}"
            dosage, freq, timing = None, None, None
        
        # Generate reasoning based on state (would use attention in production)
        reasoning = self._generate_reasoning(action_type, local_idx)
        
        return Action(
            action_type=action_type,
            action_id=local_idx,
            name=name,
            dosage=dosage,
            frequency=freq,
            timing=timing,
            confidence=float(torch.sigmoid(torch.tensor(confidence))),
            reasoning=reasoning
        )
    
    def _generate_reasoning(self, action_type: ActionType, action_id: int) -> str:
        """Generate human-readable reasoning for the action"""
        
        # This would use attention weights and bio-signal patterns in production
        reasonings = {
            ActionType.NUTRIENT: [
                "Based on your unique signal pattern, your absorption of this nutrient is optimal.",
                "Your recent biomarkers suggest a deficiency that this can address.",
                "Users with similar patterns saw significant improvement with this recommendation."
            ],
            ActionType.EXERCISE: [
                "Your Lactate Recovery Curve suggests you respond better to this exercise type.",
                "This activity level matches your current energy state from the signals.",
                "Pattern matching shows this exercise type improves your specific markers."
            ]
        }
        
        options = reasonings.get(action_type, ["Based on your bio-signal analysis."])
        return random.choice(options)
    
    def train_step(self, batch_size: int = 32) -> Optional[float]:
        """Perform one training step"""
        
        if len(self.memory) < batch_size:
            return None
        
        # Sample from memory
        transitions, indices, weights = self.memory.sample(batch_size)
        
        # Prepare batch
        states = [t.state for t in transitions]
        actions = torch.tensor([t.action for t in transitions])
        rewards = torch.tensor([t.reward for t in transitions])
        next_states = [t.next_state for t in transitions]
        dones = torch.tensor([t.done for t in transitions])
        weights = torch.tensor(weights, dtype=torch.float32)
        
        # Encode states
        state_encodings = torch.stack([self.state_encoder(s) for s in states])
        next_encodings = torch.stack([self.state_encoder(s) for s in next_states])
        
        # Current Q-values
        current_q = self.q_network(state_encodings).gather(1, actions.unsqueeze(1))
        
        # Target Q-values (Double DQN)
        with torch.no_grad():
            # Select actions using online network
            next_actions = self.q_network(next_encodings).argmax(1)
            # Evaluate using target network
            next_q = self.target_network(next_encodings).gather(1, next_actions.unsqueeze(1))
            target_q = rewards.unsqueeze(1) + self.config.gamma * next_q * (1 - dones.unsqueeze(1).float())
        
        # Compute loss
        td_errors = (current_q - target_q).abs()
        loss = (weights.unsqueeze(1) * F.smooth_l1_loss(current_q, target_q, reduction='none')).mean()
        
        # Optimize
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), 1.0)
        self.optimizer.step()
        
        # Update priorities
        self.memory.update_priorities(indices, td_errors.detach().squeeze().numpy() + 1e-6)
        
        # Soft update target network
        self._soft_update()
        
        # Decay epsilon
        self.epsilon = max(self.config.epsilon_end, self.epsilon * self.config.epsilon_decay)
        
        return loss.item()
    
    def _soft_update(self):
        """Soft update of target network"""
        for target_param, param in zip(self.target_network.parameters(), self.q_network.parameters()):
            target_param.data.copy_(
                self.config.tau * param.data + (1 - self.config.tau) * target_param.data
            )
    
    def save(self, path: str):
        """Save model checkpoint"""
        torch.save({
            'state_encoder': self.state_encoder.state_dict(),
            'q_network': self.q_network.state_dict(),
            'target_network': self.target_network.state_dict(),
            'optimizer': self.optimizer.state_dict(),
            'epsilon': self.epsilon
        }, path)
    
    def load(self, path: str):
        """Load model checkpoint"""
        checkpoint = torch.load(path)
        self.state_encoder.load_state_dict(checkpoint['state_encoder'])
        self.q_network.load_state_dict(checkpoint['q_network'])
        self.target_network.load_state_dict(checkpoint['target_network'])
        self.optimizer.load_state_dict(checkpoint['optimizer'])
        self.epsilon = checkpoint['epsilon']


# ============================================
# The Evolutionary Feedback Loop
# ============================================

class FeedbackDigest:
    """
    Processes feedback from user outcomes to strengthen/weaken
    neural pathways.
    
    "A solution found for User A (Seoul) is instantly available
     for User B (New York) who has the matching Raw Signal Fingerprint."
    """
    
    def __init__(self, agent: PrescriptionAgent):
        self.agent = agent
        self.global_successes: Dict[int, List[Tuple[np.ndarray, float]]] = {}
    
    def process_outcome(
        self,
        state: State,
        action: Action,
        next_state: State,
        adherence: float
    ) -> float:
        """Process the outcome of an action and update the agent"""
        
        # Calculate reward
        reward_dict = self.agent.reward_calculator.compute(
            state, next_state, action, adherence
        )
        reward = reward_dict['total']
        
        # Create transition
        action_idx = self._action_to_idx(action)
        transition = Transition(
            state=state,
            action=action_idx,
            reward=reward,
            next_state=next_state,
            done=False
        )
        
        # Push to memory with priority
        priority = abs(reward) + 0.1  # Higher rewards = higher priority
        self.agent.memory.push(transition, priority)
        
        # If successful, add to global knowledge
        if reward > 0.5:  # Threshold for "successful"
            self._add_global_success(action_idx, state.current_signal.numpy(), reward)
        
        return reward
    
    def _action_to_idx(self, action: Action) -> int:
        """Convert Action object to index"""
        offset = 0
        for i, action_type in enumerate(ActionType):
            if action.action_type == action_type:
                return offset + action.action_id
            offset += [
                self.agent.config.num_nutrients,
                self.agent.config.num_exercises,
                self.agent.config.num_sleep_patterns,
                self.agent.config.num_lifestyle
            ][i]
        return 0
    
    def _add_global_success(self, action_idx: int, signal: np.ndarray, reward: float):
        """Add to global success database for knowledge sharing"""
        if action_idx not in self.global_successes:
            self.global_successes[action_idx] = []
        self.global_successes[action_idx].append((signal, reward))
    
    def find_matching_successes(
        self,
        current_signal: np.ndarray,
        top_k: int = 5
    ) -> List[Tuple[int, float]]:
        """Find actions that worked for users with similar signals"""
        
        matches = []
        for action_idx, successes in self.global_successes.items():
            for signal, reward in successes:
                # Compute signal similarity
                similarity = np.dot(current_signal, signal) / (
                    np.linalg.norm(current_signal) * np.linalg.norm(signal) + 1e-8
                )
                if similarity > 0.8:  # High similarity threshold
                    matches.append((action_idx, reward * similarity))
        
        # Sort by expected reward
        matches.sort(key=lambda x: x[1], reverse=True)
        return matches[:top_k]


# ============================================
# Hypothesis Generator
# ============================================

class HypothesisGenerator:
    """
    Automatically generates and tests hypotheses from data patterns.
    
    "I found a strong correlation between 'Air Quality in Gangnam' and
     'Respiratory Signal Noise' in 5,000 users."
    """
    
    def __init__(self, min_sample_size: int = 100, min_correlation: float = 0.5):
        self.min_sample_size = min_sample_size
        self.min_correlation = min_correlation
        self.hypotheses: List[Dict] = []
    
    def analyze_correlations(
        self,
        signals: List[np.ndarray],
        external_data: Dict[str, List[float]],
        feature_names: List[str]
    ) -> List[Dict]:
        """
        Find correlations between signal features and external variables.
        
        Args:
            signals: List of signal embeddings
            external_data: Dict of external variables (e.g., air_quality, location)
            feature_names: Names of signal features
        
        Returns:
            List of discovered hypotheses
        """
        discovered = []
        
        # Convert signals to feature matrix
        signal_matrix = np.array(signals)
        
        for ext_name, ext_values in external_data.items():
            if len(ext_values) != len(signals):
                continue
            
            ext_array = np.array(ext_values)
            
            # Check correlation with each signal feature
            for feat_idx in range(signal_matrix.shape[1]):
                feat_values = signal_matrix[:, feat_idx]
                
                # Pearson correlation
                correlation = np.corrcoef(feat_values, ext_array)[0, 1]
                
                if abs(correlation) >= self.min_correlation:
                    hypothesis = {
                        "id": f"hyp_{len(discovered)}",
                        "independent_variable": ext_name,
                        "dependent_variable": feature_names[feat_idx] if feat_idx < len(feature_names) else f"feature_{feat_idx}",
                        "correlation": float(correlation),
                        "sample_size": len(signals),
                        "hypothesis_text": f"'{ext_name}' correlates with '{feature_names[feat_idx]}' (r={correlation:.3f})",
                        "proposed_action": self._generate_action_proposal(ext_name, correlation),
                        "status": "proposed"
                    }
                    discovered.append(hypothesis)
        
        # Sort by correlation strength
        discovered.sort(key=lambda x: abs(x["correlation"]), reverse=True)
        self.hypotheses.extend(discovered)
        
        return discovered
    
    def _generate_action_proposal(self, external_var: str, correlation: float) -> str:
        """Generate action proposal based on correlation"""
        direction = "positively" if correlation > 0 else "negatively"
        
        proposals = {
            "air_quality": f"Push 'Air Quality Alert' to users when levels {direction} affect signals.",
            "temperature": f"Adjust measurement calibration for temperature sensitivity ({direction} correlated).",
            "humidity": f"Update EHD suction recommendations based on humidity ({direction} impact).",
            "exercise_level": f"Personalize exercise recommendations based on signal response ({direction})."
        }
        
        return proposals.get(external_var, f"Investigate {external_var} for potential intervention.")


# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    config = RLConfig()
    
    print("Manpasik Prescription Engine (RL)")
    print("=" * 50)
    print(f"Action Space: {config.num_nutrients + config.num_exercises + config.num_sleep_patterns + config.num_lifestyle} actions")
    print(f"  - Nutrients: {config.num_nutrients}")
    print(f"  - Exercises: {config.num_exercises}")
    print(f"  - Sleep Patterns: {config.num_sleep_patterns}")
    print(f"  - Lifestyle: {config.num_lifestyle}")
    
    # Initialize agent
    agent = PrescriptionAgent(config)
    
    # Count parameters
    total_params = (
        sum(p.numel() for p in agent.state_encoder.parameters()) +
        sum(p.numel() for p in agent.q_network.parameters())
    )
    print(f"\nTotal Parameters: {total_params:,}")
    
    # Create dummy state
    dummy_state = State(
        current_signal=torch.randn(config.signal_dim),
        signal_history=torch.randn(config.history_length, config.signal_dim),
        user_profile=torch.randn(config.user_profile_dim),
        health_score=75.0,
        biomarkers={"lactate": 2.5, "glucose": 95},
        action_history=[],
        time_of_day=14,
        day_of_week=2,
        season=1
    )
    
    # Test action selection
    action = agent.select_action(dummy_state)
    print(f"\nSelected Action: {action.name}")
    print(f"  Type: {action.action_type.value}")
    print(f"  Confidence: {action.confidence:.2%}")
    print(f"  Reasoning: {action.reasoning}")







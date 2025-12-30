"""
Manpasik External Data Pipeline
================================

Fetches trusted external data from whitelisted sources to augment
the 88-dimensional sensor readings.

Philosophy: "Trust but Verify"
- Source Whitelisting: Only FDA, WHO, CDC, PubMed, NOAA
- Internal Data is King: Sensors override external when in conflict
- Cross-Validation: Use internal data to validate external trends
"""

import requests
import json
import hashlib
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re


# ============================================
# Configuration
# ============================================

@dataclass
class ExternalDataConfig:
    """Configuration for external data sources"""
    
    # API Keys (would be in environment variables in production)
    openweather_api_key: str = "YOUR_OPENWEATHER_API_KEY"
    airkorea_api_key: str = "YOUR_AIRKOREA_API_KEY"
    
    # Rate limiting
    max_requests_per_minute: int = 60
    cache_ttl_seconds: int = 300  # 5 minutes
    
    # Trust thresholds
    min_correlation_for_ingestion: float = 0.6
    min_trust_score: float = 0.7
    
    # Whitelisted domains
    whitelisted_sources: List[str] = field(default_factory=lambda: [
        "cdc.gov",
        "who.int",
        "fda.gov",
        "pubmed.ncbi.nlm.nih.gov",
        "ncbi.nlm.nih.gov",
        "openweathermap.org",
        "airkorea.or.kr",
        "noaa.gov",
        "kdca.go.kr",  # Korea Disease Control Agency
        "hmdb.ca",     # Human Metabolome Database
        "pubchem.ncbi.nlm.nih.gov"
    ])


class DataSourceType(Enum):
    """Types of external data sources"""
    METEOROLOGICAL = "meteorological"
    EPIDEMIOLOGICAL = "epidemiological"
    BIOMEDICAL = "biomedical"
    CHEMICAL = "chemical"
    NEWS = "news"


class DataQuality(Enum):
    """Quality levels for external data"""
    VERIFIED = "verified"        # Peer-reviewed or government
    TRUSTED = "trusted"          # Reputable organization
    UNVERIFIED = "unverified"    # Needs validation
    REJECTED = "rejected"        # Failed validation


# ============================================
# Data Structures
# ============================================

@dataclass
class ExternalDataPoint:
    """A single piece of external data"""
    id: str
    source_type: DataSourceType
    source_url: str
    source_domain: str
    
    # Content
    data_type: str              # e.g., "pm25", "flu_rate", "metabolite"
    value: any
    unit: Optional[str] = None
    
    # Location/Time
    location: Optional[Dict] = None  # {"lat": x, "lon": y, "region": "Seoul"}
    timestamp: str = ""
    valid_until: Optional[str] = None
    
    # Quality metrics
    trust_score: float = 0.0
    quality: DataQuality = DataQuality.UNVERIFIED
    
    # Correlation with internal data
    correlated_internal_vars: List[str] = field(default_factory=list)
    correlation_strength: float = 0.0
    
    # Processing
    processed_at: str = ""
    raw_response: Optional[str] = None


@dataclass
class ExternalDataBatch:
    """A batch of external data points"""
    batch_id: str
    source_type: DataSourceType
    fetched_at: str
    data_points: List[ExternalDataPoint]
    
    # Batch-level metrics
    avg_trust_score: float = 0.0
    accepted_count: int = 0
    rejected_count: int = 0


# ============================================
# Base Data Fetcher
# ============================================

class BaseDataFetcher(ABC):
    """Abstract base class for data fetchers"""
    
    def __init__(self, config: ExternalDataConfig):
        self.config = config
        self.cache: Dict[str, Tuple[any, float]] = {}  # {key: (data, expiry_time)}
        self.request_times: List[float] = []
    
    def _rate_limit(self):
        """Enforce rate limiting"""
        now = time.time()
        # Remove old requests from tracking
        self.request_times = [t for t in self.request_times if now - t < 60]
        
        if len(self.request_times) >= self.config.max_requests_per_minute:
            sleep_time = 60 - (now - self.request_times[0])
            if sleep_time > 0:
                time.sleep(sleep_time)
        
        self.request_times.append(now)
    
    def _get_cached(self, key: str) -> Optional[any]:
        """Get cached data if not expired"""
        if key in self.cache:
            data, expiry = self.cache[key]
            if time.time() < expiry:
                return data
            del self.cache[key]
        return None
    
    def _set_cached(self, key: str, data: any):
        """Cache data with TTL"""
        expiry = time.time() + self.config.cache_ttl_seconds
        self.cache[key] = (data, expiry)
    
    def _is_whitelisted(self, url: str) -> bool:
        """Check if URL is from a whitelisted domain"""
        for domain in self.config.whitelisted_sources:
            if domain in url:
                return True
        return False
    
    @abstractmethod
    def fetch(self, **kwargs) -> ExternalDataBatch:
        """Fetch data from the source"""
        pass


# ============================================
# Meteorological Data Fetcher
# ============================================

class MeteorologicalFetcher(BaseDataFetcher):
    """
    Fetches weather and air quality data.
    Sources: OpenWeather, AirKorea, NOAA
    """
    
    def fetch(
        self, 
        lat: float, 
        lon: float,
        include_forecast: bool = True
    ) -> ExternalDataBatch:
        """
        Fetch weather and air quality for a location.
        
        Purpose:
        - Calibrate EHD Suction efficiency (affected by humidity)
        - Correlate Respiratory Signal Noise with Fine Dust
        """
        batch_id = f"meteo_{lat}_{lon}_{int(time.time())}"
        data_points: List[ExternalDataPoint] = []
        
        # Fetch current weather
        weather_data = self._fetch_openweather(lat, lon)
        if weather_data:
            data_points.extend(weather_data)
        
        # Fetch air quality
        air_data = self._fetch_air_quality(lat, lon)
        if air_data:
            data_points.extend(air_data)
        
        # Calculate batch metrics
        trust_scores = [dp.trust_score for dp in data_points]
        avg_trust = sum(trust_scores) / len(trust_scores) if trust_scores else 0
        
        return ExternalDataBatch(
            batch_id=batch_id,
            source_type=DataSourceType.METEOROLOGICAL,
            fetched_at=datetime.utcnow().isoformat(),
            data_points=data_points,
            avg_trust_score=avg_trust,
            accepted_count=len([dp for dp in data_points if dp.quality != DataQuality.REJECTED]),
            rejected_count=len([dp for dp in data_points if dp.quality == DataQuality.REJECTED])
        )
    
    def _fetch_openweather(self, lat: float, lon: float) -> List[ExternalDataPoint]:
        """Fetch from OpenWeather API"""
        cache_key = f"openweather_{lat}_{lon}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        self._rate_limit()
        
        # In production, this would be a real API call
        # url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={self.config.openweather_api_key}"
        # response = requests.get(url)
        
        # Mock response for demo
        mock_response = {
            "main": {
                "temp": 25.5,
                "humidity": 65,
                "pressure": 1013
            },
            "weather": [{"main": "Clear"}],
            "wind": {"speed": 3.5}
        }
        
        data_points = []
        timestamp = datetime.utcnow().isoformat()
        
        # Temperature
        data_points.append(ExternalDataPoint(
            id=f"temp_{lat}_{lon}",
            source_type=DataSourceType.METEOROLOGICAL,
            source_url="https://api.openweathermap.org",
            source_domain="openweathermap.org",
            data_type="temperature",
            value=mock_response["main"]["temp"],
            unit="°C",
            location={"lat": lat, "lon": lon},
            timestamp=timestamp,
            trust_score=0.9,
            quality=DataQuality.TRUSTED,
            correlated_internal_vars=["sensor_temperature", "ehd_efficiency"],
            correlation_strength=0.85
        ))
        
        # Humidity
        data_points.append(ExternalDataPoint(
            id=f"humidity_{lat}_{lon}",
            source_type=DataSourceType.METEOROLOGICAL,
            source_url="https://api.openweathermap.org",
            source_domain="openweathermap.org",
            data_type="humidity",
            value=mock_response["main"]["humidity"],
            unit="%",
            location={"lat": lat, "lon": lon},
            timestamp=timestamp,
            trust_score=0.9,
            quality=DataQuality.TRUSTED,
            correlated_internal_vars=["ehd_efficiency", "hydrogel_impedance"],
            correlation_strength=0.78
        ))
        
        # Pressure
        data_points.append(ExternalDataPoint(
            id=f"pressure_{lat}_{lon}",
            source_type=DataSourceType.METEOROLOGICAL,
            source_url="https://api.openweathermap.org",
            source_domain="openweathermap.org",
            data_type="barometric_pressure",
            value=mock_response["main"]["pressure"],
            unit="hPa",
            location={"lat": lat, "lon": lon},
            timestamp=timestamp,
            trust_score=0.9,
            quality=DataQuality.TRUSTED,
            correlated_internal_vars=["joint_pain_prediction"],
            correlation_strength=0.72
        ))
        
        self._set_cached(cache_key, data_points)
        return data_points
    
    def _fetch_air_quality(self, lat: float, lon: float) -> List[ExternalDataPoint]:
        """Fetch air quality data"""
        # Mock AirKorea/NOAA response
        mock_response = {
            "pm25": 35,
            "pm10": 45,
            "o3": 0.03,
            "uv_index": 6
        }
        
        timestamp = datetime.utcnow().isoformat()
        data_points = []
        
        # PM2.5
        data_points.append(ExternalDataPoint(
            id=f"pm25_{lat}_{lon}",
            source_type=DataSourceType.METEOROLOGICAL,
            source_url="https://airkorea.or.kr",
            source_domain="airkorea.or.kr",
            data_type="pm25",
            value=mock_response["pm25"],
            unit="μg/m³",
            location={"lat": lat, "lon": lon},
            timestamp=timestamp,
            trust_score=0.95,
            quality=DataQuality.VERIFIED,  # Government source
            correlated_internal_vars=["respiratory_noise", "inflammation_index"],
            correlation_strength=0.82
        ))
        
        # UV Index
        data_points.append(ExternalDataPoint(
            id=f"uv_{lat}_{lon}",
            source_type=DataSourceType.METEOROLOGICAL,
            source_url="https://www.noaa.gov",
            source_domain="noaa.gov",
            data_type="uv_index",
            value=mock_response["uv_index"],
            unit="",
            location={"lat": lat, "lon": lon},
            timestamp=timestamp,
            trust_score=0.95,
            quality=DataQuality.VERIFIED,
            correlated_internal_vars=["vitamin_d_synthesis", "oxidative_stress"],
            correlation_strength=0.68
        ))
        
        return data_points


# ============================================
# Epidemiological Data Fetcher
# ============================================

class EpidemiologicalFetcher(BaseDataFetcher):
    """
    Fetches disease outbreak and epidemic data.
    Sources: CDC, WHO, K-CDC (KDCA)
    """
    
    def fetch(
        self,
        region: str = "US",
        diseases: List[str] = None
    ) -> ExternalDataBatch:
        """
        Fetch epidemiological data for a region.
        
        Purpose:
        - Adjust Bayesian Prior for virus detection
        - Highlight relevant biomarkers based on local outbreaks
        """
        if diseases is None:
            diseases = ["influenza", "covid19", "dengue", "rsv"]
        
        batch_id = f"epi_{region}_{int(time.time())}"
        data_points: List[ExternalDataPoint] = []
        
        # Fetch flu data
        flu_data = self._fetch_cdc_flu(region)
        if flu_data:
            data_points.extend(flu_data)
        
        # Fetch outbreak alerts
        outbreak_data = self._fetch_who_outbreaks(region)
        if outbreak_data:
            data_points.extend(outbreak_data)
        
        # Calculate batch metrics
        trust_scores = [dp.trust_score for dp in data_points]
        avg_trust = sum(trust_scores) / len(trust_scores) if trust_scores else 0
        
        return ExternalDataBatch(
            batch_id=batch_id,
            source_type=DataSourceType.EPIDEMIOLOGICAL,
            fetched_at=datetime.utcnow().isoformat(),
            data_points=data_points,
            avg_trust_score=avg_trust,
            accepted_count=len([dp for dp in data_points if dp.quality != DataQuality.REJECTED]),
            rejected_count=len([dp for dp in data_points if dp.quality == DataQuality.REJECTED])
        )
    
    def _fetch_cdc_flu(self, region: str) -> List[ExternalDataPoint]:
        """Fetch CDC FluView data"""
        # In production:
        # url = f"https://www.cdc.gov/flu/weekly/fluviewinteractive.htm?data={region}"
        # response = requests.get(url)
        # parsed = BeautifulSoup(response.text, 'html.parser')
        
        # Mock response
        mock_data = {
            "ili_rate": 2.8,           # Influenza-like illness rate
            "positive_rate": 12.5,     # % of tests positive
            "severity": "moderate",
            "trend": "increasing"
        }
        
        timestamp = datetime.utcnow().isoformat()
        
        return [
            ExternalDataPoint(
                id=f"ili_rate_{region}",
                source_type=DataSourceType.EPIDEMIOLOGICAL,
                source_url="https://www.cdc.gov/flu/weekly",
                source_domain="cdc.gov",
                data_type="ili_rate",
                value=mock_data["ili_rate"],
                unit="%",
                location={"region": region},
                timestamp=timestamp,
                trust_score=0.98,
                quality=DataQuality.VERIFIED,
                correlated_internal_vars=["fever_biomarker", "inflammation_index"],
                correlation_strength=0.75
            ),
            ExternalDataPoint(
                id=f"flu_positivity_{region}",
                source_type=DataSourceType.EPIDEMIOLOGICAL,
                source_url="https://www.cdc.gov/flu/weekly",
                source_domain="cdc.gov",
                data_type="flu_positivity_rate",
                value=mock_data["positive_rate"],
                unit="%",
                location={"region": region},
                timestamp=timestamp,
                trust_score=0.98,
                quality=DataQuality.VERIFIED,
                correlated_internal_vars=["virus_detection_prior"],
                correlation_strength=0.88
            )
        ]
    
    def _fetch_who_outbreaks(self, region: str) -> List[ExternalDataPoint]:
        """Fetch WHO Disease Outbreak News"""
        # Mock outbreak data
        mock_outbreaks = [
            {
                "disease": "dengue",
                "region": "Southeast Asia",
                "alert_level": "high",
                "cases_this_week": 5420
            }
        ]
        
        data_points = []
        timestamp = datetime.utcnow().isoformat()
        
        for outbreak in mock_outbreaks:
            data_points.append(ExternalDataPoint(
                id=f"outbreak_{outbreak['disease']}_{outbreak['region']}",
                source_type=DataSourceType.EPIDEMIOLOGICAL,
                source_url="https://www.who.int/emergencies/disease-outbreak-news",
                source_domain="who.int",
                data_type="outbreak_alert",
                value={
                    "disease": outbreak["disease"],
                    "alert_level": outbreak["alert_level"],
                    "cases": outbreak["cases_this_week"]
                },
                location={"region": outbreak["region"]},
                timestamp=timestamp,
                trust_score=0.99,
                quality=DataQuality.VERIFIED,
                correlated_internal_vars=["non_target_analysis", "biomarker_highlight"],
                correlation_strength=0.70
            ))
        
        return data_points


# ============================================
# Biomedical Knowledge Fetcher
# ============================================

class BiomedicalFetcher(BaseDataFetcher):
    """
    Fetches biomedical knowledge from scientific databases.
    Sources: PubMed, HMDB, ChemSpider
    """
    
    def fetch_pubmed(
        self,
        query: str,
        max_results: int = 5
    ) -> ExternalDataBatch:
        """
        Fetch relevant papers from PubMed.
        
        Purpose:
        - RAG for AI Coach responses
        - Update coaching advice with latest research
        """
        batch_id = f"pubmed_{hashlib.md5(query.encode()).hexdigest()[:8]}"
        
        # In production:
        # url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmax={max_results}&retmode=json"
        # response = requests.get(url)
        
        # Mock response
        mock_papers = [
            {
                "pmid": "38123456",
                "title": "Lactate Metabolism in Long COVID: A Systematic Review",
                "abstract": "We found persistent lactate elevation in 45% of Long COVID patients...",
                "journal": "Nature Medicine",
                "year": 2024
            },
            {
                "pmid": "38123457",
                "title": "Electrochemical Biomarkers for Early Diabetes Detection",
                "abstract": "CV analysis of sweat samples showed 92% sensitivity...",
                "journal": "Biosensors and Bioelectronics",
                "year": 2024
            }
        ]
        
        data_points = []
        timestamp = datetime.utcnow().isoformat()
        
        for paper in mock_papers:
            data_points.append(ExternalDataPoint(
                id=f"pubmed_{paper['pmid']}",
                source_type=DataSourceType.BIOMEDICAL,
                source_url=f"https://pubmed.ncbi.nlm.nih.gov/{paper['pmid']}",
                source_domain="pubmed.ncbi.nlm.nih.gov",
                data_type="research_paper",
                value={
                    "title": paper["title"],
                    "abstract": paper["abstract"],
                    "journal": paper["journal"],
                    "year": paper["year"]
                },
                timestamp=timestamp,
                trust_score=0.95,  # Peer-reviewed
                quality=DataQuality.VERIFIED,
                correlated_internal_vars=["coaching_knowledge", "rag_context"],
                correlation_strength=0.90
            ))
        
        return ExternalDataBatch(
            batch_id=batch_id,
            source_type=DataSourceType.BIOMEDICAL,
            fetched_at=timestamp,
            data_points=data_points,
            avg_trust_score=0.95,
            accepted_count=len(data_points),
            rejected_count=0
        )
    
    def fetch_hmdb(
        self,
        peak_positions: List[float],
        analyte_type: str = "metabolite"
    ) -> ExternalDataBatch:
        """
        Match unknown peaks to known metabolites in HMDB.
        
        Purpose:
        - Identify unknown peaks in 88-dim vectors
        - Non-target analysis augmentation
        """
        batch_id = f"hmdb_{int(time.time())}"
        
        # Mock HMDB matching
        mock_matches = [
            {
                "hmdb_id": "HMDB0000190",
                "name": "Lactic Acid",
                "peak_match": 0.32,
                "confidence": 0.92
            },
            {
                "hmdb_id": "HMDB0000122",
                "name": "D-Glucose",
                "peak_match": 0.45,
                "confidence": 0.88
            }
        ]
        
        data_points = []
        timestamp = datetime.utcnow().isoformat()
        
        for match in mock_matches:
            data_points.append(ExternalDataPoint(
                id=f"hmdb_{match['hmdb_id']}",
                source_type=DataSourceType.CHEMICAL,
                source_url=f"https://hmdb.ca/metabolites/{match['hmdb_id']}",
                source_domain="hmdb.ca",
                data_type="metabolite_match",
                value={
                    "hmdb_id": match["hmdb_id"],
                    "name": match["name"],
                    "peak_position": match["peak_match"],
                    "match_confidence": match["confidence"]
                },
                timestamp=timestamp,
                trust_score=0.92,
                quality=DataQuality.VERIFIED,
                correlated_internal_vars=["swv_peaks", "non_target_analysis"],
                correlation_strength=match["confidence"]
            ))
        
        return ExternalDataBatch(
            batch_id=batch_id,
            source_type=DataSourceType.CHEMICAL,
            fetched_at=timestamp,
            data_points=data_points,
            avg_trust_score=0.92,
            accepted_count=len(data_points),
            rejected_count=0
        )


# ============================================
# Unified External Data Manager
# ============================================

class ExternalDataManager:
    """
    Unified manager for all external data sources.
    Implements the "Trust but Verify" philosophy.
    """
    
    def __init__(self, config: ExternalDataConfig = None):
        self.config = config or ExternalDataConfig()
        
        # Initialize fetchers
        self.meteo_fetcher = MeteorologicalFetcher(self.config)
        self.epi_fetcher = EpidemiologicalFetcher(self.config)
        self.biomedical_fetcher = BiomedicalFetcher(self.config)
        
        # Data store
        self.batches: List[ExternalDataBatch] = []
        self.rejected_data: List[ExternalDataPoint] = []
    
    def fetch_all_for_user(
        self,
        user_location: Dict,
        user_conditions: List[str] = None,
        current_symptoms: List[str] = None
    ) -> Dict[str, ExternalDataBatch]:
        """
        Fetch all relevant external data for a user.
        
        Returns categorized batches.
        """
        results = {}
        
        # Meteorological data
        if user_location.get("lat") and user_location.get("lon"):
            results["meteorological"] = self.meteo_fetcher.fetch(
                lat=user_location["lat"],
                lon=user_location["lon"]
            )
        
        # Epidemiological data
        region = user_location.get("region", "US")
        results["epidemiological"] = self.epi_fetcher.fetch(region=region)
        
        # Biomedical knowledge (based on symptoms)
        if current_symptoms:
            query = " OR ".join(current_symptoms)
            results["biomedical"] = self.biomedical_fetcher.fetch_pubmed(query)
        
        # Store batches
        for batch in results.values():
            self.batches.append(batch)
        
        return results
    
    def validate_against_internal(
        self,
        external_data: ExternalDataPoint,
        internal_value: float,
        internal_var_name: str
    ) -> Tuple[bool, str]:
        """
        Cross-validate external data against internal sensor data.
        
        Policy: Internal Data is King.
        """
        # Check if this external data is relevant
        if internal_var_name not in external_data.correlated_internal_vars:
            return False, "Not correlated with internal variable"
        
        # Check correlation strength
        if external_data.correlation_strength < self.config.min_correlation_for_ingestion:
            return False, f"Correlation too weak: {external_data.correlation_strength}"
        
        # Check trust score
        if external_data.trust_score < self.config.min_trust_score:
            return False, f"Trust score too low: {external_data.trust_score}"
        
        return True, "Validated"
    
    def resolve_conflict(
        self,
        external_data: ExternalDataPoint,
        internal_assessment: str,
        internal_confidence: float
    ) -> Dict:
        """
        Resolve conflicts between external and internal data.
        
        Policy: Internal Data is King.
        "Despite low regional flu trends, your specific sample shows 
         high viral load. Immediate isolation recommended."
        """
        resolution = {
            "trust_internal": True,
            "explanation": "",
            "action": "",
            "flag_for_review": False
        }
        
        # Extract external assessment
        external_value = external_data.value
        
        # Conflict detection (simplified)
        conflict_detected = False
        
        # Example: Flu outbreak says "low risk" but sensor says "high risk"
        if external_data.data_type == "ili_rate":
            if external_value < 3 and internal_assessment == "high_viral_load":
                conflict_detected = True
        
        if conflict_detected:
            resolution["flag_for_review"] = True
            resolution["explanation"] = (
                f"CONFLICT DETECTED: External source ({external_data.source_domain}) indicates "
                f"low regional risk, but internal sensor shows high individual risk. "
                f"DECISION: Trust internal sensor (confidence: {internal_confidence:.1%})."
            )
            resolution["action"] = (
                "Despite low regional trends, your specific sample shows elevated markers. "
                "Immediate precautionary measures recommended."
            )
        
        return resolution
    
    def get_augmented_context(
        self,
        internal_features: List[float],
        user_location: Dict
    ) -> Dict:
        """
        Get external context to augment internal 88-dim features.
        
        Returns a context dict for the AI model.
        """
        context = {
            "environmental": {},
            "epidemiological": {},
            "knowledge": [],
            "bayesian_priors": {}
        }
        
        # Fetch external data
        all_data = self.fetch_all_for_user(user_location)
        
        # Environmental context
        if "meteorological" in all_data:
            for dp in all_data["meteorological"].data_points:
                if dp.quality != DataQuality.REJECTED:
                    context["environmental"][dp.data_type] = {
                        "value": dp.value,
                        "unit": dp.unit,
                        "trust": dp.trust_score
                    }
        
        # Epidemiological priors
        if "epidemiological" in all_data:
            for dp in all_data["epidemiological"].data_points:
                if dp.quality != DataQuality.REJECTED:
                    if dp.data_type == "ili_rate":
                        # Adjust Bayesian prior for flu detection
                        base_prior = 0.05  # 5% baseline
                        adjusted_prior = base_prior * (1 + dp.value / 10)
                        context["bayesian_priors"]["influenza"] = adjusted_prior
                    elif dp.data_type == "outbreak_alert":
                        disease = dp.value.get("disease", "unknown")
                        context["bayesian_priors"][disease] = 0.15  # Elevated prior
        
        return context


# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    config = ExternalDataConfig()
    manager = ExternalDataManager(config)
    
    print("Manpasik External Data Pipeline")
    print("=" * 50)
    print(f"Whitelisted Sources: {len(config.whitelisted_sources)}")
    print(f"Min Correlation: {config.min_correlation_for_ingestion}")
    print(f"Min Trust Score: {config.min_trust_score}")
    
    # Test fetch
    user_location = {"lat": 37.5665, "lon": 126.9780, "region": "Seoul"}
    results = manager.fetch_all_for_user(user_location, current_symptoms=["fatigue", "lactate"])
    
    print("\n--- Fetched Data ---")
    for category, batch in results.items():
        print(f"\n{category.upper()}: {len(batch.data_points)} data points")
        print(f"  Avg Trust Score: {batch.avg_trust_score:.2f}")
        for dp in batch.data_points[:2]:
            print(f"  - {dp.data_type}: {dp.value} ({dp.source_domain})")
    
    # Test augmented context
    context = manager.get_augmented_context([0.1] * 88, user_location)
    print("\n--- Augmented Context ---")
    print(f"Environmental: {list(context['environmental'].keys())}")
    print(f"Bayesian Priors: {context['bayesian_priors']}")







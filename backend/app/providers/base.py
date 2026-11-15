from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseDataProvider(ABC):
    """
    Base data provider interface for all NASA and external data sources.
    Every provider must identify its name, spatial resolution, temporal range,
    and whether data was served from cache or fallback.
    """

    def __init__(self, name: str, resolution: str, source_agency: str):
        self.name = name
        self.resolution = resolution
        self.source_agency = source_agency

    @abstractmethod
    async def fetch_point_data(
        self,
        lat: float,
        lon: float,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch time-series data for a specific point.
        Returns a dict containing 'metadata', 'provenance', and 'data'.
        """
        pass

    def get_provenance(
        self,
        is_cached: bool = False,
        is_fallback: bool = False,
        date_range: Optional[str] = None,
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate standardized provenance block for API responses."""
        return {
            "source_name": self.name,
            "resolution": self.resolution,
            "agency": self.source_agency,
            "is_cached": is_cached,
            "is_fallback": is_fallback,
            "date_range": date_range or "Climatological / Historical",
            "spatial_notice": f"Derived from {self.resolution} satellite/model grid, not ground field instrumentation.",
            "note": note or ""
        }

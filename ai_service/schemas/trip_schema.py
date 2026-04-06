from pydantic import BaseModel, Field, validator
from typing import Optional

class TripPlanRequest(BaseModel):
    destination: str
    origin: Optional[str] = ""
    days: int = Field(default=5, ge=1, le=30)
    people: int = Field(default=1, ge=1, le=50)
    budget: str = "medium"
    vibe: str = "balanced"
    preferences: Optional[str] = ""
    start_date: Optional[str] = None
    currency: str = "INR"

    @validator("budget")
    def validate_budget(cls, v):
        if v.lower() not in ["low", "medium", "high", "budget", "luxury"]:
            raise ValueError("budget must be low, medium, or high")
        return v.lower()

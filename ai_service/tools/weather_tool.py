import os
import httpx
from datetime import datetime, timedelta

CONDITION_MAP = {
    "Clear":        "Sunny",
    "Clouds":       "Cloudy",
    "Rain":         "Rainy",
    "Drizzle":      "Drizzle",
    "Thunderstorm": "Thunderstorm",
    "Snow":         "Snow",
    "Mist":         "Misty",
    "Fog":          "Foggy",
    "Haze":         "Hazy",
}

UNAVAILABLE = lambda destination, error=None: {
    "available": False,
    "destination": destination,
    "forecast": [],
    "summary": "Weather unavailable.",
    "error": error or "Weather service unavailable"
}

def get_openweather_key() -> str:
    return (os.getenv("OPENWEATHER_KEY") or "").strip()

async def get_weather(destination: str, days: int, start_date: str = None) -> dict:
    """
    Fetch weather forecast for destination.
    
    BEHAVIOR:
    - If OPENWEATHER_KEY is missing or empty → return UNAVAILABLE immediately
    - Use httpx.AsyncClient for all HTTP calls
    - Step 1: Call OpenWeather Geocoding API to get lat/lon
    - Step 2: Call forecast API for 5-day forecast
    - Step 3: Aggregate 3-hour slots into daily summaries
    - Step 4: Build date list starting from start_date if provided
    - Step 5: Build summary string
    - On ANY exception → return UNAVAILABLE(destination)
    """
    
    openweather_key = get_openweather_key()

    if not openweather_key:
        return UNAVAILABLE(destination, "OpenWeather API key is missing")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Step 1: Geocode destination
            geo_url = "https://api.openweathermap.org/geo/1.0/direct"
            geo_params = {
                "q": destination,
                "limit": 1,
                "appid": openweather_key
            }
            geo_resp = await client.get(geo_url, params=geo_params)
            geo_resp.raise_for_status()
            geo_data = geo_resp.json()
            
            if not geo_data or len(geo_data) == 0:
                return UNAVAILABLE(destination, "Could not geocode destination")
            
            lat = geo_data[0]["lat"]
            lon = geo_data[0]["lon"]
            
            # Step 2: Get forecast
            forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
            forecast_params = {
                "lat": lat,
                "lon": lon,
                "cnt": days * 8,
                "units": "metric",
                "appid": openweather_key
            }
            forecast_resp = await client.get(forecast_url, params=forecast_params)
            forecast_resp.raise_for_status()
            forecast_data = forecast_resp.json()
            
            # Step 3 & 4: Aggregate by day
            daily_forecasts = {}
            start_dt = datetime.fromisoformat(start_date) if start_date else datetime.now()
            
            for item in forecast_data.get("list", []):
                dt = datetime.fromtimestamp(item["dt"])
                date_key = dt.strftime("%Y-%m-%d")
                
                if date_key not in daily_forecasts:
                    daily_forecasts[date_key] = {
                        "conditions": [],
                        "temps": [],
                        "humidity": []
                    }
                
                weather_main = item["main"]
                daily_forecasts[date_key]["conditions"].append(item["weather"][0]["main"])
                daily_forecasts[date_key]["temps"].append((item["main"]["temp_min"], item["main"]["temp_max"]))
                daily_forecasts[date_key]["humidity"].append(item["main"]["humidity"])
            
            # Build forecast array
            forecast_array = []
            day_counter = 1
            
            for i, (date_key, data) in enumerate(sorted(daily_forecasts.items())):
                if day_counter > days:
                    break
                
                # Most common condition
                condition_main = max(set(data["conditions"]), key=data["conditions"].count)
                condition_display = CONDITION_MAP.get(condition_main, condition_main)
                
                # Min/max temperatures
                min_temp = int(min([t[0] for t in data["temps"]]))
                max_temp = int(max([t[1] for t in data["temps"]]))
                
                # Average humidity
                avg_humidity = int(sum(data["humidity"]) / len(data["humidity"]))
                
                forecast_array.append({
                    "day": day_counter,
                    "date": date_key,
                    "condition": condition_display,
                    "humidity": avg_humidity,
                    "temperature": {
                        "min": min_temp,
                        "max": max_temp
                    }
                })
                day_counter += 1
            
            # Step 5: Build summary
            if forecast_array:
                first_day = forecast_array[0]
                avg_temp = (first_day["temperature"]["min"] + first_day["temperature"]["max"]) // 2
                summary = f"Mostly {first_day['condition']} with avg {avg_temp}°C"
            else:
                summary = "Weather forecast unavailable."
            
            return {
                "available": True,
                "destination": destination,
                "summary": summary,
                "forecast": forecast_array
            }
    
    except httpx.HTTPStatusError as e:
        error_text = ""
        try:
            error_text = e.response.text
        except Exception:
            error_text = ""
        detail = f"Weather API error {e.response.status_code}"
        if error_text:
            detail = f"{detail}: {error_text[:180]}"
        return UNAVAILABLE(destination, detail)
    except Exception as e:
        return UNAVAILABLE(destination, f"Weather lookup failed: {str(e)}")

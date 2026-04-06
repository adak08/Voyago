import os
import httpx

UNAVAILABLE = lambda origin, destination, error=None: {
    "available": False,
    "origin": origin,
    "destination": destination,
    "distance": "Unavailable",
    "duration": "Unavailable",
    "mode": "Unavailable",
    "alternatives": [],
    "error": error or "Route service unavailable"
}

def get_ors_api_key() -> str:
    return (os.getenv("ORS_API_KEY") or "").strip()

def derive_mode(distance_km: float) -> str:
    """Determine transport mode based on distance."""
    if distance_km < 50:    return "Car"
    if distance_km < 250:   return "Bus"
    if distance_km < 1200:  return "Train"
    return "Flight"

def build_alternatives(mode: str, distance_str: str, duration_str: str) -> list:
    """Build 2 alternative transport modes."""
    all_modes = ["Car", "Bus", "Train", "Flight"]
    alternatives = []
    durations = {
        "Car":    "estimate based on distance",
        "Bus":    "estimate based on distance",
        "Train":  "estimate based on distance",
        "Flight": "1 hour 20 mins"
    }
    for m in all_modes:
        if m != mode and len(alternatives) < 2:
            alternatives.append({
                "mode": m,
                "distance": distance_str,
                "duration": durations[m]
            })
    return alternatives

async def get_route(origin: str, destination: str) -> dict:
    """
    Get route, distance, and duration between origin and destination.
    
    BEHAVIOR:
    - If ORS_API_KEY missing or empty → return UNAVAILABLE immediately
    - If origin is empty string → return UNAVAILABLE immediately
    - Use httpx.AsyncClient for all HTTP calls
    - Step 1: Geocode origin
    - Step 2: Geocode destination
    - Step 3: Get driving directions
    - Step 4: Convert distance and duration to human-readable format
    - Step 5: Derive transport mode
    - Step 6: Build alternatives
    - On ANY exception → return UNAVAILABLE(origin, destination)
    """
    
    ors_api_key = get_ors_api_key()

    if not ors_api_key:
        return UNAVAILABLE(origin, destination, "OpenRouteService API key is missing")
    
    if not origin or origin.strip() == "":
        return UNAVAILABLE(origin, destination, "No origin provided")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Step 1: Geocode origin
            geo_url = "https://api.openrouteservice.org/geocode/search"
            geo_params = {
                "api_key": ors_api_key,
                "text": origin,
                "size": 1
            }
            geo_origin = await client.get(geo_url, params=geo_params)
            geo_origin.raise_for_status()
            origin_data = geo_origin.json()
            
            if not origin_data.get("features") or len(origin_data["features"]) == 0:
                return UNAVAILABLE(origin, destination, "Could not geocode origin")
            
            origin_coords = origin_data["features"][0]["geometry"]["coordinates"]
            origin_lon, origin_lat = origin_coords[0], origin_coords[1]
            
            # Step 2: Geocode destination
            geo_dest = await client.get(geo_url, params={
                "api_key": ors_api_key,
                "text": destination,
                "size": 1
            })
            geo_dest.raise_for_status()
            dest_data = geo_dest.json()
            
            if not dest_data.get("features") or len(dest_data["features"]) == 0:
                return UNAVAILABLE(origin, destination, "Could not geocode destination")
            
            dest_coords = dest_data["features"][0]["geometry"]["coordinates"]
            dest_lon, dest_lat = dest_coords[0], dest_coords[1]
            
            # Step 3: Get directions
            directions_url = "https://api.openrouteservice.org/v2/directions/driving-car"
            directions_body = {
                "coordinates": [
                    [origin_lon, origin_lat],
                    [dest_lon, dest_lat]
                ]
            }
            directions_resp = await client.post(
                directions_url,
                json=directions_body,
                headers={"Authorization": ors_api_key}
            )
            directions_resp.raise_for_status()
            directions_data = directions_resp.json()
            
            if not directions_data.get("routes") or len(directions_data["routes"]) == 0:
                return UNAVAILABLE(origin, destination, "No route found between origin and destination")
            
            route = directions_data["routes"][0]
            distance_meters = route["summary"]["distance"]
            duration_seconds = route["summary"]["duration"]
            
            # Step 4: Convert to human-readable format
            distance_km = distance_meters / 1000
            distance_str = f"{distance_km:.0f} km"
            
            hours = int(duration_seconds // 3600)
            mins = int((duration_seconds % 3600) // 60)
            duration_str = f"{hours} hours {mins} mins"
            
            # Step 5: Derive mode
            mode = derive_mode(distance_km)
            
            # Step 6: Build alternatives
            alternatives = build_alternatives(mode, distance_str, duration_str)
            
            return {
                "available": True,
                "origin": origin,
                "destination": destination,
                "distance": distance_str,
                "duration": duration_str,
                "mode": mode,
                "alternatives": alternatives
            }
    
    except httpx.HTTPStatusError as e:
        error_text = ""
        try:
            error_text = e.response.text
        except Exception:
            error_text = ""
        detail = f"Route API error {e.response.status_code}"
        if error_text:
            detail = f"{detail}: {error_text[:180]}"
        return UNAVAILABLE(origin, destination, detail)
    except Exception as e:
        return UNAVAILABLE(origin, destination, f"Route lookup failed: {str(e)}")

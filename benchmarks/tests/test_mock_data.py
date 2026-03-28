from spec_bench.mock_data import (
    OPEN_METEO_CURRENT,
    OPEN_METEO_FORECAST,
    TFNSW_STOP_FINDER_HORNSBY,
    TFNSW_DEPARTURES_HORNSBY,
    TFNSW_TRIP_HORNSBY_CHATSWOOD,
    GTFS_ADVISORY_T1,
    build_seed_profile,
)


def test_open_meteo_has_thunderstorm():
    assert OPEN_METEO_CURRENT["current"]["weather_code"] == 95

def test_open_meteo_forecast_has_5_days():
    assert len(OPEN_METEO_FORECAST["daily"]["time"]) == 5

def test_tfnsw_stops_include_hornsby():
    locations = TFNSW_STOP_FINDER_HORNSBY["locations"]
    names = [loc["name"] for loc in locations]
    assert any("Hornsby" in n for n in names)

def test_tfnsw_departures_have_delays():
    events = TFNSW_DEPARTURES_HORNSBY["stopEvents"]
    delayed = [e for e in events if e.get("departureTimeEstimated")]
    assert len(delayed) >= 1

def test_tfnsw_trip_has_transfer():
    journeys = TFNSW_TRIP_HORNSBY_CHATSWOOD["journeys"]
    assert len(journeys) >= 1
    legs = journeys[0]["legs"]
    assert len(legs) >= 1

def test_gtfs_advisory_mentions_t1():
    header = GTFS_ADVISORY_T1["header"]
    assert "T1" in header or "North Shore" in header

def test_seed_profile_has_required_keys():
    profile = build_seed_profile("test-key")
    assert "smrt_api_key" in profile
    assert "smrt_user_name" in profile
    assert "smrt_user_location" in profile
    assert "smrt_routes" in profile

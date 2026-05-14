from datetime import datetime, date, time, timezone
from incident_utils import is_incident_overdue

def test_incident_is_overdue_for_open_state():
    now = datetime(2026, 1, 2, 12, 0, 0, tzinfo=timezone.utc)
    assert is_incident_overdue(date(2026, 1, 1), time(10, 0, 0), "Открыт", now) is True

def test_incident_is_not_overdue_for_closed_state():
    now = datetime(2026, 1, 2, 12, 0, 0, tzinfo=timezone.utc)
    assert is_incident_overdue(date(2026, 1, 1), time(10, 0, 0), "Закрыт", now) is False

def test_incident_is_not_overdue_before_24_hours():
    now = datetime(2026, 1, 2, 12, 0, 0, tzinfo=timezone.utc)
    assert is_incident_overdue(date(2026, 1, 2), time(0, 1, 0), "Открыт", now) is False

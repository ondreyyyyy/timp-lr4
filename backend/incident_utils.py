from datetime import datetime, timedelta, timezone, date, time

CLOSED_STATES = {"закрыт", "отработан", "closed", "resolved", "done"}

def is_incident_overdue(inc_date: date, inc_time: time, state: str, now: datetime | None = None) -> bool:
    check_time = now or datetime.now(timezone.utc)
    incident_dt = datetime.combine(inc_date, inc_time).replace(tzinfo=timezone.utc)
    normalized_state = (state or "").strip().lower()
    return normalized_state not in CLOSED_STATES and (check_time - incident_dt) >= timedelta(hours=24)

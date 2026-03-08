function minutesFromSeconds(seconds: number) {
  return Math.ceil(seconds / 60);
}

function subtractMinutesFromTime(timeStr: string, minutesToSubtract: number) {
  const [h, m] = timeStr.split(":").map(Number);

  const total = h * 60 + m - minutesToSubtract;

  const safe = Math.max(total, 0);

  const hh = Math.floor(safe / 60);
  const mm = safe % 60;

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function buildRoomWarning({
  gapDurationMin,
  nextClassStartTime,
  toRoomDurationSeconds,
  toNextClassDurationSeconds,
}: {
  gapDurationMin: number;
  nextClassStartTime: string;
  toRoomDurationSeconds: number;
  toNextClassDurationSeconds: number;
}) {
  const walkToRoomMin = minutesFromSeconds(toRoomDurationSeconds);
  const walkToNextClassMin = minutesFromSeconds(toNextClassDurationSeconds);

  const usableMinutes = gapDurationMin - walkToRoomMin - walkToNextClassMin;

  const leaveAt = subtractMinutesFromTime(
    nextClassStartTime,
    walkToNextClassMin,
  );

  if (usableMinutes <= 0) {
    return {
      status: "not_recommended",
      walkToRoomMin,
      walkToNextClassMin,
      usableMinutes: 0,
      leaveAt,
      message: "Room is too far to use before next class",
    };
  }

  if (usableMinutes < 10) {
    return {
      status: "tight",
      walkToRoomMin,
      walkToNextClassMin,
      usableMinutes,
      leaveAt,
      message: `Only ${usableMinutes} min usable. Leave by ${leaveAt}`,
    };
  }

  return {
    status: "good",
    walkToRoomMin,
    walkToNextClassMin,
    usableMinutes,
    leaveAt,
    message: `Stay ${usableMinutes} min. Leave by ${leaveAt}`,
  };
}

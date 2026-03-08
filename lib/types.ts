/**
 * Domain types for the NebulaLearn schedule application.
 *
 * ScheduleClass  – A single class on the daily timeline, with a visual
 *                  status that controls badge color and timeline dot style.
 * ScheduleGap    – A detected free block between classes, paired with a
 *                  suggested quiet study spot and mini-map metadata.
 * WalkingSegment – A walking-time connector rendered between two classes.
 */

export type ClassStatus = "completed" | "current" | "upcoming" | "late-afternoon";

export interface ScheduleClass {
  id: string;
  status: ClassStatus;
  courseCode: string;
  courseName: string;
  startTime: string;
  endTime: string;
  location: string;
  professor?: string;
  /** Directions URL to the *next* class (populated by ScheduleContext) */
  directionsUrl?: string | null;
  /** Walking duration in seconds to the next class */
  walkDurationSeconds?: number | null;
  /** Formatted "leave by" time, e.g. "10:05 AM" */
  leaveByTime?: string | null;
}

export interface ScheduleGap {
  duration: string;
  durationMinutes: number;
  message: string;
  suggestedSpot: {
    name: string;
    badge: string;
    walkTime: string;
    amenity: string;
  };
  directionsUrl?: string | null;
}

export interface WalkingSegment {
  duration: string;
  directionsUrl?: string | null;
}

export type SpaceStatus = "available" | "busy";

export interface NearbySpace {
  id: string;
  name: string;
  building: string;
  status: SpaceStatus;
  amenity: string;
  walkTime: string;
  _directionsUrl?: string | null;
}

export interface CampusTransit {
  id: string;
  routeName: string;
  destination: string;
  nextArrival: string;
  shuttleLabel: string;
}

/** Result from the closest-empty-room API */
export interface EmptyRoom {
  room: string;
  building: string;
  _walkDurationStr?: string;
  _directionsUrl?: string | null;
  _walkSeconds?: number | null;
}

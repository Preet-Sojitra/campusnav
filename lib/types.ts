/**
 * Domain types for the NebulaLearn schedule application.
 *
 * ScheduleClass  – A single class on the daily timeline, with a visual
 *                  status that controls badge color and timeline dot style.
 * ScheduleGap    – A detected free block between classes, paired with a
 *                  suggested quiet study spot and mini-map metadata.
 * WalkingSegment – A walking-time connector rendered between two classes.
 */

export type ClassStatus = "current" | "upcoming" | "late-afternoon";

export interface ScheduleClass {
  id: string;
  status: ClassStatus;
  courseCode: string;
  courseName: string;
  startTime: string;
  endTime: string;
  location: string;
  professor?: string;
}

export interface ScheduleGap {
  duration: string;
  message: string;
  suggestedSpot: {
    name: string;
    badge: string;
    walkTime: string;
    amenity: string;
  };
}

export interface WalkingSegment {
  duration: string;
}

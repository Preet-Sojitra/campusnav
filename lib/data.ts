/**
 * Mock data that mirrors the NebulaLearn Figma design.
 *
 * In production these would come from an API; the static arrays here
 * ensure the UI renders an exact replica of the design spec during
 * development and review.
 */

import type { ScheduleClass, ScheduleGap, WalkingSegment } from "./types";

export const scheduleClasses: ScheduleClass[] = [
  {
    id: "cs2305",
    status: "current",
    courseCode: "CS 2305",
    courseName: "Discrete Math",
    startTime: "9:00 AM",
    endTime: "10:15 AM",
    location: "ECSS 2.412",
    professor: "Professor Smith",
  },
  {
    id: "govt2305",
    status: "upcoming",
    courseCode: "GOVT 2305",
    courseName: "American Government",
    startTime: "11:00 AM",
    endTime: "12:15 PM",
    location: "GR 3.302",
  },
  {
    id: "ecs1101",
    status: "late-afternoon",
    courseCode: "ECS 1101",
    courseName: "Intro to Engineering",
    startTime: "2:30 PM",
    endTime: "3:45 PM",
    location: "TI Auditorium",
  },
];

export const walkingSegments: WalkingSegment[] = [
  { duration: "10 min walk to next class" },
];

export const scheduleGap: ScheduleGap = {
  duration: "1h 45m",
  message: "Maximize your time between classes",
  suggestedSpot: {
    name: "McDermott Library, 3rd Floor",
    badge: "QUIET SPOT SUGGESTED",
    walkTime: "2 min",
    amenity: "Power outlets",
  },
};

# Product

<!-- impeccable:product-schema 1 -->

Source: the user's written spec (Rehearse build prompt, 2026-09-22). The user said "go ahead" instead of running an interview round; facts below come from that spec. Items marked (inferred) were decided by the agent.

## Platform

web

## Stack

delegated: Next.js 16 (App Router) + TypeScript + Tailwind v4, Supabase (Postgres, anonymous auth, RLS), Claude API for question generation and grading, browser Web Speech API for transcription (inferred: no paid speech provider in Phase 1).

## Users

Anyone preparing for a job interview: students, first-job seekers, career switchers, non-native English speakers, people with no tech background. They practice alone, often on a phone, in short gaps (bus stop, lunch break), sometimes at a desk the night before an interview.

## Product Purpose

A free, public interview practice app. The user names a job, gets tailored questions, answers by voice or typing, and gets consistent, explainable scores plus one concrete fix per answer. Success means users measurably improve across sessions and come back the next day.

## Positioning

Retry is the core mechanic: answer, see exactly what to fix, answer again, and see the score move. Progress rewards improvement, not time spent. Free with no paywall.

## Operating Context

- Time to first question under 30 seconds, no signup (guest mode via anonymous auth).
- A round is one question (about 2 minutes); a session is 3 to 10 questions.
- Mic may be denied or unsupported (Firefox); typing is a full first-class path.

## Capabilities and Constraints

Phase 1: role input, seniority, optional job description, Quick Round (3 questions), voice and typing answers, per-question rubric scoring with feedback, retry with before/after, session summary, archive, XP, levels, daily streak.
Not in Phase 1: templates, dashboards, badges, Daily Challenge, Full Mock, PDF export, personas, leaderboards, avatar, TTS.
Scores are computed in code from AI rubric items; delivery metrics (pace, fillers) are measured in code. Fair-use daily limit on AI grading to control cost.

## Brand Commitments

Name "Rehearse" is a placeholder. Tone: kind but honest, encouraging without fake praise. Visual feel requested: friendly, modern, calm; not corporate, not childish.

## Evidence on Hand

None. No users, testimonials, or statistics exist; do not fabricate any.

## Product Principles

1. Feedback you can act on: every score comes with one specific fix.
2. Progress must reflect real skill gains.
3. Short loops beat long sessions.
4. Honest, explainable, consistent scoring.

## Accessibility & Inclusion

WCAG 2.2 AA, full keyboard use, screen-reader labels, typing mode always available, delivery metrics can be turned off (non-native speakers), prefers-reduced-motion respected.

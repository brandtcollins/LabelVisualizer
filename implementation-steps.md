# Label Visualizer MVP – Architecture & Approach (Gemini)

## Overview

This project is a **Label Visualizer** that allows a user to upload their finished label artwork and generate a realistic product mockup using AI.

The system generates a **visual preview**, not a print proof.

The AI’s role is to **stage a product photograph around an existing label**, while preserving the label artwork as faithfully as possible.

---

## Key Design Decision (Current Direction)

We no longer manage or maintain:

- Pre-built scenes
- Alpha masks
- Manual warping or compositing
- GPU-hosted pipelines (ComfyUI, SDXL, ControlNet)
- OpenAI / DALL·E models (blocked by org verification)

Instead, we rely on:

- **Gemini 2.5 Flash Image**
- User-supplied artwork as an **input image**
- Strict, repetitive **prompt guardrails**
- AI-generated containers, environments, lighting, and backgrounds

This significantly simplifies infrastructure and removes platform approval blockers.

---

## Core Principle

The label artwork is treated as a **finished, printed, physical object**.

The AI must not redesign or reinterpret the label.

The AI may only:

- Invent the product container
- Invent the environment
- Apply lighting, shadows, and perspective
- Stage a realistic product photograph

This is enforced through prompt constraints and image-conditioned generation.

---

## Technology Stack

### Frontend

- Next.js (existing MVP shell)
- Responsibilities:
  - Artwork upload
  - Optional preset selection (label size / style)
  - Trigger generation
  - Display generated preview

### Backend

- Next.js API routes
- Responsibilities:
  - Receive artwork upload
  - Encode artwork as image input
  - Construct guarded prompt
  - Call Gemini Image Generation API
  - Return generated image to client

### AI Model

- **Gemini 2.5 Flash Image**
- Accessed via Gemini API / Google AI Studio API key
- Supports:
  - Image input
  - Image generation and editing
  - Multi-image fusion
- Generated images include **SynthID watermarking**

---

## User Flow

1. User uploads finished label artwork (PNG/JPG).
2. User optionally selects a preset (e.g. label size or style).
3. User clicks “Generate Mockup”.
4. Backend sends:
   - The uploaded artwork as an input image
   - A strict prompt describing placement rules
5. Gemini generates a realistic product photograph.
6. The resulting image is returned and displayed.

---

## Prompting Strategy

We do not ask the model to design or imagine the label.

We explicitly frame the task as **photographing a real, already-printed label**.

Prompt rules are:

- Explicit
- Repetitive
- Contractual in tone
- Focused on what the model must NOT do

### Example Production Prompt

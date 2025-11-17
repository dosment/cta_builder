# AI-Native 48-Hour Project Strategy

## Overview

A structured, fast-execution plan tailored for AI-assisted prototyping
using Claude Code. Designed to demonstrate speed, clarity, judgment, and
strong AI-native workflow habits.

------------------------------------------------------------------------

## 1. Clarify Scope (First 5 Minutes)

-   Identify the user.
-   Write the core use case / happy path.
-   List non-goals.
-   Define "Done":
    -   One core flow working end-to-end\
    -   Basic error handling\
    -   Setup + usage instructions in README\
    -   Manual test checklist

------------------------------------------------------------------------

## 2. Architecture Before Code

-   Draft minimal file structure:
    -   `src/` or `app/`
    -   `routes/` or main handler
    -   `services/`
    -   `data/` or mock storage
    -   `tests/` (optional manual test plan)
-   Keep it tiny. No frameworks unless absolutely required.
-   Let Claude propose structure, then refine before coding.

------------------------------------------------------------------------

## 3. Coding Standards

-   Max **500 lines per file**
-   Max **40 lines per function**
-   Clear naming (`snake_case` functions/vars, `PascalCase` classes)
-   Basic error handling for I/O
-   No global state unless documented
-   Keep code modular and readable

------------------------------------------------------------------------

## 4. AI Usage Strategy

-   Work in **phases**, not monolithic requests:
    1.  Requirements clarification\
    2.  Architecture proposal\
    3.  Scaffold files\
    4.  Implement the MVP core flow\
    5.  Refactor/simplify\
    6.  Add error handling + polish\
-   Use **small, targeted prompts**:
    -   "Update only X file"
    -   "Refactor this function for clarity"
    -   "Generate test checklist for core flow"
-   Reject giant single-file outputs
-   Ask Claude to critique its own code

------------------------------------------------------------------------

## 5. Build Ugly First, Refine Later

-   Goal: **working prototype ASAP**\
-   First implementation can be naive\
-   Once it works:
    -   Improve structure\
    -   Add basic validation\
    -   Add comments/docstrings for tricky bits\
    -   Trim complexity

------------------------------------------------------------------------

## 6. Git Discipline

-   Initialize repo immediately
-   Commit early:
    -   Initial skeleton
    -   Core flow implemented
    -   Error handling + refactor
    -   README added
-   Commit with descriptive messages
-   Keep the commit story clean and clear

------------------------------------------------------------------------

## 7. Documentation & Testing

### README Should Include:

-   What the project does\
-   How to install / run (simple steps)\
-   Example usage or sample inputs\
-   Known limitations\
-   Future improvements (optional)

### Manual Test Checklist:

-   App/server/CLI starts\
-   Core flow happy path\
-   Invalid input\
-   Boundary cases\
-   Error handling\
-   Recovery after error

------------------------------------------------------------------------

## 8. Time Management

-   **0--10 min:** Scope, Done, Architecture\
-   **10--60 min:** Build first end-to-end version\
-   **60--120 min:** Cleanup, improve structure, error handling\
-   **Afterwards:** README, testing, polish

------------------------------------------------------------------------

## 9. Mindset (What They're Testing)

-   Comfort with ambiguity\
-   Bias toward action\
-   Rapid iteration\
-   Using AI as a partner, not a vending machine\
-   Shipping "good enough"\
-   Clear communication and reasoning\
-   Strong judgment about complexity

------------------------------------------------------------------------

## 10. Core Reminder

**Speed + clarity beats cleverness.\
MVP beats architecture diagrams.\
Iteration beats perfection.**

This challenge is designed for AI-native thinkers. Use that to your
advantage.

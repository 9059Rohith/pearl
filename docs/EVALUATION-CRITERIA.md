# Evaluation Criteria

## Rubric

| Dimension | Weight | What Strong Looks Like |
|---|---|---|
| Codebase Understanding | 20% | Builds a correct mental model before coding. Identifies how the pieces connect, where state lives, and how data flows between apps. |
| Root-Cause Diagnosis | 20% | Identifies the actual failure mechanism, not just symptoms. Explains why the bug is intermittent, why templates are involved, and what structural flaw enables it. |
| Refactoring Judgment | 15% | Improves the right seam with restraint. Knows when to stop. Does not rewrite modules unrelated to the problem. Explains the tradeoff between fixing now and deferring. |
| Feature Delivery | 15% | Adds the requested behavior cleanly. UTM capture works end-to-end. Data lands in the right place and stays out of user-visible surfaces. |
| Verification Quality | 10% | Tests or provides convincing proof of correctness. Demonstrates the bug is fixed, not just hidden. Shows the feature works with realistic inputs. |
| AI Supervision Quality | 10% | Uses AI deliberately. Accepts useful output, rejects or modifies weak suggestions, and can articulate why. Does not blindly paste AI output without reading it. |
| Communication | 10% | Explains tradeoffs and risks clearly. Narrates decision-making in real time. Flags what was left incomplete and why. |

## Strong Candidate Signals

- Forms a mental model before editing code. Uses Phase 1 to build understanding rather than jumping to solutions.
- Narrows intervention to the right seam. Fixes the root cause where it lives rather than patching symptoms across multiple files.
- Does not confuse the visible bug with the root cause. Understands that "editing page A corrupts page B" is a symptom; the mechanism is the interesting part.
- Verifies behavior after changes. Runs the app, inspects state, writes a test, or provides other evidence that the fix works.
- Treats AI as a tool, not an oracle. Accepts suggestions that are correct, challenges suggestions that are wrong, and explains the difference.
- Identifies related issues beyond the stated problem. Notices structural debt, missing validations, or risk areas without being prompted.
- Communicates tradeoffs. Explains what they chose to fix, what they chose to leave, and why.

## Weak Candidate Signals

- Starts coding immediately without reading the codebase or forming a model.
- Scatters fixes across multiple files without a coherent theory of the bug.
- Copies AI output without challenging it. Cannot explain what the AI-generated code does or why it is correct.
- Ignores regressions. Makes changes that break existing behavior without noticing.
- Cannot explain seam choices. Does not articulate why they changed one file rather than another.
- Over-refactors or under-refactors without justification. Rewrites half the codebase for a single bug, or applies a band-aid to a structural problem.
- Treats the bug report literally. Tries to reproduce the exact scenario rather than reasoning about the mechanism.
- Ignores the feature request or implements it in a way that violates the stated constraints (e.g., UTM data leaking into user-visible notes).

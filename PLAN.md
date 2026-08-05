# Tech Recruitment Company — Development Plan Summary

## Core Concept
A South Africa-based technical recruitment company differentiated by
candidate verification and developer-specific skill validation —
positioned as more trustworthy than LinkedIn's candidate pool or
generalist recruitment agencies.

## Phase 1: MVP Scope (Tech Recruitment)

### 1. Candidate Verification Layer
- Integrate with a third-party background screening provider for:
  - Qualification verification (SAQA — National Learners' Records
    Database for SA qualifications; SAQA foreign evaluation for
    international ones)
  - Employment history verification (confirm dates, role, reason for
    leaving with past employers)
  - ID verification
- Build POPIA-compliant consent flow — candidates must explicitly
  opt in before any check runs
- Output: a "Verified" badge/profile summary attached to each
  candidate record, showing what was checked and when

### 2. Developer Hub (Skill Validation Layer)
- GitHub OAuth integration (candidate connects their own account —
  opt-in, not scraped)
- Pull via GitHub API:
  - Language breakdown across repos
  - Commit frequency/consistency over time
  - PR history, code review participation, issue activity
  - Repo quality signals (tests, docs, structure)
- Aggregate into a per-candidate developer profile dashboard
- V2: extend connectors to GitLab and Bitbucket (important — many SA
  enterprise/.NET devs use these over public GitHub)
- Candidate-facing: candidates see and control their own profile,
  can choose to share it with clients (flips it from surveillance to
  a personal branding tool)
- Explicitly position as ONE input alongside manual technical
  screening — not a replacement for it (public repo activity ≠
  private day-job output, so it has real blind spots)

### 3. Core ATS/CRM
- Candidate pipeline management
- Client pipeline management
- Structured candidate notes (stack depth, seniority signals,
  verification status)
- Start lean (off-the-shelf tool or lightweight build) — don't
  over-engineer before placement volume justifies it

### 4. Documents & Data Handling
- Client Service Agreement template (fee %, terms, guarantee period,
  ownership-of-introduction clause)
- Candidate consent/POPIA form (covers both background checks and
  GitHub data usage)
- Secure storage for verification data and ID documents (POPIA
  compliance — encryption, access control, retention policy)

## Build Approach
- MVP developer hub (GitHub OAuth + API + simple dashboard) is
  realistically buildable solo given existing full-stack/.NET
  background — no need to outsource this piece
- Verification layer: integrate with existing accredited screening
  provider rather than building SAQA/employer-verification
  infrastructure from scratch
- Sequence: prove verification + developer hub concept manually /
  semi-manually with first few candidates before investing in full
  platform build-out

## Future Milestone: Pivot to Nursing/Medical Sector
- Verification differentiator carries over and strengthens: SANC
  (South African Nursing Council) registration + scope-of-practice
  verification replaces GitHub/technical-skill validation as the
  credibility layer
- Expect heavier temp/locum staffing admin (shift-based contract
  work) vs. tech's perm-weighted model
- Different buyer/sales motion: hospital groups and healthcare
  facility HR vs. CTOs/engineering managers
- Not a near-term build item — flagged here so the platform
  architecture (verification layer especially) can stay flexible
  enough to extend to a different credential type later

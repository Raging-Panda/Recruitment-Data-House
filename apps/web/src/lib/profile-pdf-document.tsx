import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { DeveloperProfile, Endorsement, SkillFingerprint } from "@ipskill/shared";

/**
 * Rendered server-side via @react-pdf/renderer's renderToBuffer — this is a
 * separate React runtime from react-dom (PDF primitives, not HTML), so it
 * must only ever be imported from the API route that renders it, never
 * from a page or client component.
 */

const SKILL_CATEGORIES: (keyof SkillFingerprint)[] = [
  "Backend",
  "Frontend",
  "Database",
  "DevOps",
  "Cloud",
  "Problem Solving",
  "Communication",
  "Leadership",
];

const PRIMARY = "#6366f1";
const TEXT_MUTED = "#6b7280";
const BORDER = "#e5e7eb";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#111827" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 10, fontWeight: 700, color: TEXT_MUTED },
  generatedAt: { fontSize: 8, color: TEXT_MUTED },
  profileRow: { flexDirection: "row", marginTop: 24, alignItems: "center" },
  name: { fontSize: 20, fontWeight: 700 },
  headline: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  location: { fontSize: 9, color: TEXT_MUTED, marginTop: 2 },
  scoreBox: { marginLeft: "auto", alignItems: "center" },
  scoreValue: { fontSize: 22, fontWeight: 700, color: PRIMARY },
  scoreLabel: { fontSize: 8, color: TEXT_MUTED },
  about: { marginTop: 16, fontSize: 10, lineHeight: 1.5, color: "#374151" },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 24, marginBottom: 10 },
  skillRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  skillLabel: { width: 110, fontSize: 9 },
  barTrack: { flex: 1, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3 },
  barFill: { height: 6, backgroundColor: PRIMARY, borderRadius: 3 },
  skillValue: { width: 32, textAlign: "right", fontSize: 9, color: TEXT_MUTED },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    fontSize: 9,
    color: "#374151",
    backgroundColor: "#f3f4f6",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  endorsement: { borderTopWidth: 1, borderTopColor: BORDER, paddingVertical: 8 },
  endorsementHeader: { fontSize: 10 },
  endorsementComment: { fontSize: 9, color: TEXT_MUTED, marginTop: 2, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: TEXT_MUTED,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
});

export function ProfilePdfDocument({
  profile,
  displayName,
  skillFingerprint,
  topLanguages,
  endorsements,
}: {
  profile: DeveloperProfile;
  displayName: string;
  skillFingerprint: SkillFingerprint;
  topLanguages: string[];
  endorsements: Endorsement[];
}) {
  const generatedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document title={`${displayName} — IPSkill Profile`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>IPSKILL — UNIQUE SKILLS. PERFECT MATCH.</Text>
          <Text style={styles.generatedAt}>Generated {generatedAt}</Text>
        </View>

        <View style={styles.profileRow}>
          <View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.headline}>{profile.headline}</Text>
            {profile.location && <Text style={styles.location}>{profile.location}</Text>}
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{profile.overallScore}%</Text>
            <Text style={styles.scoreLabel}>Overall Score</Text>
          </View>
        </View>

        {profile.about && <Text style={styles.about}>{profile.about}</Text>}

        <Text style={styles.sectionTitle}>Skill Fingerprint</Text>
        {SKILL_CATEGORIES.map((category) => {
          const score = skillFingerprint[category] ?? 0;
          return (
            <View key={category} style={styles.skillRow}>
              <Text style={styles.skillLabel}>{category}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, score)}%` }]} />
              </View>
              <Text style={styles.skillValue}>{score}%</Text>
            </View>
          );
        })}

        {topLanguages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Languages</Text>
            <View style={styles.chipRow}>
              {topLanguages.map((lang) => (
                <Text key={lang} style={styles.chip}>
                  {lang}
                </Text>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Endorsements</Text>
        {endorsements.length === 0 ? (
          <Text style={{ fontSize: 9, color: TEXT_MUTED }}>No endorsements yet.</Text>
        ) : (
          endorsements.slice(0, 8).map((e) => (
            <View key={e.id} style={styles.endorsement}>
              <Text style={styles.endorsementHeader}>
                {e.endorserName} endorsed {e.skillCategory}
              </Text>
              {e.comment && <Text style={styles.endorsementComment}>&ldquo;{e.comment}&rdquo;</Text>}
            </View>
          ))
        )}

        <Text style={styles.footer} fixed>
          This profile is auto-generated from GitHub activity and platform data via IPSkill —
          github.com/{profile.githubLogin}
        </Text>
      </Page>
    </Document>
  );
}

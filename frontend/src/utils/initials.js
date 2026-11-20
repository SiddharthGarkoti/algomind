/**
 * Intelligent avatar initials generator.
 * Handles:
 * - "god ninja" / "god_ninja" / "godninja" -> "GN"
 * - "nishant_verma" / "nishant verma" -> "NV"
 * - "sachin_sharma" -> "SS"
 * - "GodNinja" / "JohnDoe" -> "GN" / "JD"
 * - Single word "alice" -> "AL"
 */
export function getInitials(name) {
  if (!name) return '??';
  const clean = String(name).trim();
  if (!clean) return '??';

  // Explicit rule for god ninja / godninja / god_ninja
  if (/^god[\s_-]?ninja$/i.test(clean)) return 'GN';

  // Multi-word separated by space, underscore, hyphen, or dot
  const parts = clean.split(/[\s_\-.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // CamelCase splitting (e.g. GodNinja -> GN, NishantVerma -> NV)
  const camelParts = clean.split(/(?=[A-Z])/).filter(Boolean);
  if (camelParts.length >= 2) {
    return (camelParts[0][0] + camelParts[1][0]).toUpperCase();
  }

  // Single word: first 2 characters
  return clean.slice(0, 2).toUpperCase();
}

export default getInitials;

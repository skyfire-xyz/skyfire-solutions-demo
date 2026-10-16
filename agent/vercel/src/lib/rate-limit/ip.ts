/**
 * IP normalization. Two goals:
 *  - collapse alternate spellings of the same host, so one client cannot get
 *    several counter buckets for free;
 *  - reject junk, so a hostile header cannot mint unbounded distinct keys.
 *
 * Pure: no env, no Next imports, so the verification script can import it.
 */

const IPV4 =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

/** Longest legal IPv6 text form is 45 chars; anything longer is not an address. */
const MAX_IP_TEXT_LENGTH = 45;

function hextetsFrom(segment: string): string[] | null {
  if (!segment) return [];
  const parts = segment.split(":");
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes(".")) {
      // a trailing dotted quad (::ffff:192.0.2.1) is two hextets
      if (i !== parts.length - 1) return null;
      if (!IPV4.test(part)) return null;
      const octets = part.split(".").map(Number);
      out.push(
        (((octets[0] << 8) | octets[1]) >>> 0).toString(16),
        (((octets[2] << 8) | octets[3]) >>> 0).toString(16),
      );
      continue;
    }
    if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
    out.push(part);
  }
  return out;
}

/**
 * Bucket IPv6 by its /64 rather than its /128. A residential IPv6 subscriber is
 * handed a whole /64 (often larger) and can pick a fresh address per request at
 * zero cost, which would make a /128 counter useless. The cost is that one
 * household shares a budget -- the same trade as IPv4 NAT.
 */
function ipv6Bucket(ip: string): string | null {
  const halves = ip.split("::");
  if (halves.length > 2) return null;

  const head = hextetsFrom(halves[0]);
  const tail = halves.length === 2 ? hextetsFrom(halves[1]) : [];
  if (!head || !tail) return null;

  let groups: string[];
  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 1) return null;
    groups = [...head, ...new Array<string>(fill).fill("0"), ...tail];
  } else {
    if (head.length !== 8) return null;
    groups = head;
  }

  // Canonical, unambiguous key for the /64. Not a valid address literal by
  // design -- it is a counter key, and writing the four hextets out plainly
  // avoids the "2001:db8:0:0::/64" oddity that zero-compression would produce.
  return (
    groups
      .slice(0, 4)
      .map((g) => g.replace(/^0+(?=.)/, ""))
      .join(":") + "/64"
  );
}

/**
 * Returns a stable counter key for a raw header value, or null if the value is
 * not an IP address we are willing to trust.
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.trim().toLowerCase();
  // generous upper bound before the cheap checks below; re-checked after
  if (!ip || ip.length > MAX_IP_TEXT_LENGTH + 8) return null;

  // "[2001:db8::1]:443" -> "2001:db8::1"
  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    if (end === -1) return null;
    ip = ip.slice(1, end);
  } else if ((ip.match(/:/g)?.length ?? 0) === 1) {
    // "203.0.113.7:51234" -> "203.0.113.7" (some proxies append the port).
    // Exactly one colon cannot be IPv6, so this is unambiguous.
    ip = ip.slice(0, ip.indexOf(":"));
  }
  if (!ip || ip.length > MAX_IP_TEXT_LENGTH) return null;

  // ::ffff:203.0.113.7 and 203.0.113.7 are the same host, two spellings.
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped && IPV4.test(mapped[1])) return mapped[1];

  if (IPV4.test(ip)) return ip;
  if (ip.includes(":")) return ipv6Bucket(ip);
  return null;
}

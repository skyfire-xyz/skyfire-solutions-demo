const IPV4 =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const MAX_IP_TEXT_LENGTH = 45;

function hextetsFrom(segment: string): string[] | null {
  if (!segment) return [];
  const parts = segment.split(":");
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes(".")) {
      if (i !== parts.length - 1 || !IPV4.test(part)) return null;
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

  return (
    groups
      .slice(0, 4)
      .map((g) => g.replace(/^0+(?=.)/, ""))
      .join(":") + "/64"
  );
}

/** Returns a normalized counter key for a raw header value, or null. */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.trim().toLowerCase();
  if (!ip || ip.length > MAX_IP_TEXT_LENGTH + 8) return null;

  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    if (end === -1) return null;
    ip = ip.slice(1, end);
  } else if ((ip.match(/:/g)?.length ?? 0) === 1) {
    ip = ip.slice(0, ip.indexOf(":"));
  }
  if (!ip || ip.length > MAX_IP_TEXT_LENGTH) return null;

  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped && IPV4.test(mapped[1])) return mapped[1];

  if (IPV4.test(ip)) return ip;
  if (ip.includes(":")) return ipv6Bucket(ip);
  return null;
}

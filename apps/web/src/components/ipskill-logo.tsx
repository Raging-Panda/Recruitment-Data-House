import Image from "next/image";

export function IPSkillLogo({ size = 96 }: { size?: number }) {
  return (
    <Image
      src="/brand/icon.png"
      alt="IPSkill"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      priority
    />
  );
}

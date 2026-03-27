import Image from "next/image";

interface WuWeiMarkProps {
  className?: string;
}

export function WuWeiMark({
  className,
}: WuWeiMarkProps) {
  return (
    <Image
      src="/wu-logo.png"
      alt="Wu-Weism"
      width={2400}
      height={1896}
      unoptimized
      className={`block ${className ?? ""}`}
    />
  );
}

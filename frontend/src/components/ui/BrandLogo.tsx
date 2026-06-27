import Image from "next/image";
import Link from "next/link";
import servicesLogo from "@/app/public/terrabyte_academy_logo.png";

type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 flex-shrink-0 ${className}`}>
      <Image
        src={servicesLogo}
        alt="Terrabyte Services"
        height={36}
        className="w-auto h-9 object-contain"
        priority
      />
    </Link>
  );
}

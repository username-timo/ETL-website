import Image from 'next/image';
import Link from 'next/link';

const Logo: React.FC<{ sticky?: boolean }> = ({ sticky = true }) => {
  return (
    <Link href="/" className="flex items-center gap-3 no-underline">
      <Image
        src="/etl-images/etl-logo.png"
        alt="Engineering Trade Links"
        width={84}
        height={84}
        className="object-contain"
        priority
        style={{ marginTop: "-8px", mixBlendMode: "multiply" }}
      />
      <div className="flex flex-col leading-none">
        <span className={`font-black uppercase tracking-wide ${sticky ? "text-primary dark:text-white" : "text-white"}`}
          style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "1.05rem" }}>
          Engineering Trade Links
        </span>
        <span className={`text-[11px] font-semibold tracking-widest uppercase mt-0.5 ${sticky ? "text-gray" : "text-white/75"}`}>
          Co. Ltd — Uganda
        </span>
      </div>
    </Link>
  );
};

export default Logo;

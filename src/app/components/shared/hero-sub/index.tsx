import React, { FC } from "react";
import Breadcrumb from "../../breadcrumb";
import { BreadcrumbLink } from "@/app/types/data/breadcrumb";

interface HeroSubProps {
    title: string;
    description: string;
    breadcrumbLinks: BreadcrumbLink[];
    coverImage?: string;
}

const HeroSub: FC<HeroSubProps> = ({ title, description, breadcrumbLinks, coverImage }) => {

    if (coverImage) {
        return (
            <section className="relative overflow-hidden bg-[#113767]">
                {/* Soft fill keeps the full fitted cover from looking boxed-in on wide screens. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={coverImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-md"
                />
                <div className="relative mx-auto flex h-[clamp(260px,42vw,560px)] w-full max-w-[1500px] items-center justify-center px-3 py-4 sm:px-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={coverImage}
                        alt=""
                        className="h-full w-full object-contain drop-shadow-2xl"
                    />
                </div>
                <div className="sr-only">
                    <h2>{title}</h2>
                    <p>{description}</p>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className=" text-center bg-cover pt-36 pb-20 relative bg-gradient-to-b from-white from-10% dark:from-darkmode to-herobg to-90% dark:to-darklight overflow-x-hidden" >
                <h2 className="text-midnight_text text-[50px] leading-[1.2] relative font-bold dark:text-white capitalize">{title}</h2>
                <p className="text-lg text-gray font-normal max-w-md w-full mx-auto mt-7 mb-12 sm:px-0 px-4">
                    {description}
                </p>
                <Breadcrumb links={breadcrumbLinks} />
            </section>
        </>
    );
};

export default HeroSub;

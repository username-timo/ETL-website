import React from "react";
import Link from "next/link";

const Location = () => {
  return (
    <>
      <section className="bg-primary py-8 px-4 sm:py-12 lg:py-24">
        <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md">
            <div className="">
                <div className="grid md:grid-cols-6 lg:grid-cols-9 grid-cols-1 gap-3 sm:gap-5 lg:gap-7 border-b border-solid border-white border-opacity-50 pb-6 sm:pb-8 lg:pb-11">
                    <div className="col-span-3">
                        <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl leading-[1.1] font-bold">Kampala Office</h2>
                    </div>
                    <div className="col-span-3">
                        <p className="text-sm sm:text-base lg:text-xl leading-relaxed text-IceBlue font-normal max-w-80 lg:max-w-64 text-white text-opacity-50">Plot 1353, Sonde-Seeta Road, Goma Division, Mukono. P.O. Box 27555, Kampala, Uganda.</p>
                    </div>
                    <div className="col-span-3">
                        <Link href="mailto:tradelinksltd@gmail.com" className="block text-sm sm:text-base lg:text-xl text-white font-medium underline break-all">tradelinksltd@gmail.com</Link>
                        <Link href="tel:+256776566522" className="text-sm sm:text-base lg:text-xl text-white text-opacity-80 flex items-center gap-2 hover:text-opacity-100 w-fit"><span className="text-white !text-opacity-40">Call</span>+256 776 566 522</Link>
                    </div>
                </div>
                <div className="grid md:grid-cols-6 lg:grid-cols-9 grid-cols-1 gap-3 sm:gap-5 lg:gap-7 pt-6 sm:pt-8 lg:pt-12">
                    <div className="col-span-3">
                        <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl leading-[1.1] font-bold">Tororo Office</h2>
                    </div>
                    <div className="col-span-3">
                        <p className="text-sm sm:text-base lg:text-xl leading-relaxed text-white text-opacity-50 font-normal max-w-80 lg:max-w-64">P.O. Box 300095, Tororo, Uganda</p>
                    </div>
                    <div className="col-span-3">
                        <Link href="https://engineeringtradelinks.com" className="block text-sm sm:text-base lg:text-xl text-white font-medium underline break-all">www.engineeringtradelinks.com</Link>
                        <Link href="tel:+256704545163" className="text-sm sm:text-base lg:text-xl text-white text-opacity-80 text-IceBlue flex items-center gap-2 hover:text-opacity-100 w-fit"><span className="text-white !text-opacity-40">Call</span>+256 704 545 163</Link>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </>
  );
};

export default Location;

import React from "react";
import Link from "next/link";

const Location = () => {
  return (
    <>
      <section className="bg-primary lg:py-24 py-16 px-4">
        <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md">
            <div className="">
                <div className="grid md:grid-cols-6 lg:grid-cols-9 grid-cols-1 gap-7 border-b border-solid border-white border-opacity-50 pb-11">
                    <div className="col-span-3">
                        <h2 className="text-white text-4xl leading-[1.2] font-bold">Kampala Office</h2>
                    </div>
                    <div className="col-span-3">
                        <p className="text-xl text-IceBlue font-normal max-w-64 text-white text-opacity-50">Plot 1353, Sonde-Seeta Road, Goma Division, Mukono. P.O. Box 27555, Kampala, Uganda.</p>
                    </div>
                    <div className="col-span-3">
                        <Link href="mailto:tradelinksltd@gmail.com" className="text-xl text-white font-medium underline">tradelinksltd@gmail.com</Link>
                        <Link href="tel:+256776566522" className="text-xl text-white text-opacity-80 flex items-center gap-2 hover:text-opacity-100 w-fit"><span className="text-white !text-opacity-40">Call</span>+256 776 566 522</Link>
                    </div>
                </div>
                <div className="grid md:grid-cols-6 lg:grid-cols-9 grid-cols-1 gap-7 pt-12">
                    <div className="col-span-3">
                        <h2 className="text-white text-4xl leading-[1.2] font-bold">Tororo Office</h2>
                    </div>
                    <div className="col-span-3">
                        <p className="text-xl text-white text-opacity-50 font-normal max-w-64">P.O. Box 300095, Tororo, Uganda</p>
                    </div>
                    <div className="col-span-3">
                        <Link href="https://engineeringtradelinks.com" className="text-xl text-white font-medium underline">www.engineeringtradelinks.com</Link>
                        <Link href="tel:+256704545163" className="text-xl text-white text-opacity-80 text-IceBlue flex items-center gap-2 hover:text-opacity-100 w-fit"><span className="text-white !text-opacity-40">Call</span>+256 704 545 163</Link>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </>
  );
};

export default Location;

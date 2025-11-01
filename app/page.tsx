'use client';

import { useState } from 'react';
import Image from 'next/image';
import Slideshow from '../components/Slideshow';
import Ticker from '../components/Ticker';
import Noise from '../components/Noise';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(1);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-white px-6 md:px-20 lg:px-32 xl:px-48 pt-[100px] pb-20 mt-[52px] relative overflow-hidden min-h-[calc(100vh-52px)] flex items-center">
        <Noise patternAlpha={10} />
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-9 w-full relative z-10">
          <div className="w-full flex flex-col items-center gap-8">
            {/* Booking Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-[7px] bg-white rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              <span className="w-1.5 h-1.5 bg-[#0CB300] rounded-full"></span>
              <span className="text-[14.8px] leading-[1.84]">{t('bookingBadge')}</span>
            </div>
            
            {/* Main Heading */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap md:flex-nowrap">
                <span className="text-4xl md:text-6xl xl:text-[72px] font-bold leading-[1.2] tracking-[-0.04em] whitespace-nowrap">{t('heroUnlimited')}</span>
                <Slideshow />
                <span className="text-4xl md:text-6xl xl:text-[72px] font-bold leading-[1.2] tracking-[-0.04em] whitespace-nowrap">{t('heroDesign')}</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap md:flex-nowrap">
                <span className="text-4xl md:text-6xl xl:text-[72px] font-normal leading-[1.2] tracking-[-0.04em] whitespace-nowrap opacity-50">{t('heroFor')}</span>
                <Ticker />
                <span className="text-4xl md:text-6xl xl:text-[72px] font-bold leading-[1.2] tracking-[-0.04em] whitespace-nowrap">{t('heroSolidStartups')}</span>
              </div>
            </div>
            
            {/* Subheading */}
            <p className="text-base leading-[1.6] tracking-[-0.01em] text-center text-black/50 max-w-[500px] mt-2">
              {t('heroSubheading')}
            </p>
          </div>
          
          {/* CTA Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white rounded-[33px] p-2">
              <button className="bg-[#09090B] text-white px-6 py-[11px] border-none rounded-full font-bold text-[15.1px] cursor-pointer shadow-[24px_24px_74.67px_-2.5px_rgba(0,0,0,0.18),inset_0px_-16px_48px_0px_rgba(0,0,0,1)]">
                {t('choosePlan')}
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex gap-[-6px]">
                <Image src="/avatar1-7324be.png" alt="Client 1" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-0 first:ml-0" />
                <Image src="/avatar2-7324be.png" alt="Client 2" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-1.5" />
                <Image src="/avatar3-4171bf.png" alt="Client 3" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-1.5" />
                <Image src="/avatar4-7324be.png" alt="Client 4" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-1.5" />
                <Image src="/avatar5-7324be.png" alt="Client 5" width={31} height={31} className="w-[31px] h-[31px] rounded-full border border-white -ml-1.5" />
              </div>
              <p className="text-[14.8px] leading-[1.84] text-black/50">{t('trustedByLeaders')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="bg-[#FAFAFA] px-6 md:px-20 lg:px-32 xl:px-48 py-20 min-h-screen flex items-center">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="text-center mb-16">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              {t('highlightsBadge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.25] mb-4 px-4">
              {t('highlightsTitle')}
            </h2>
            <p className="text-lg text-[#71717B] max-w-[700px] mx-auto px-4">
              {t('highlightsSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6">
              <div className="w-full h-[280px] bg-gradient-to-br from-[#f093fb] to-[#f5576c] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium mb-2">{t('highlightsCard1Title')}</h3>
              <p className="text-[#71717B] text-base">
                {t('highlightsCard1Desc')}
              </p>
            </div>
            <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6">
              <div className="w-full h-[280px] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium mb-2">{t('highlightsCard2Title')}</h3>
              <p className="text-[#71717B] text-base">
                {t('highlightsCard2Desc')}
              </p>
            </div>
            <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6">
              <div className="w-full h-[280px] bg-gradient-to-br from-[#fa709a] to-[#fee140] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium mb-2">{t('highlightsCard3Title')}</h3>
              <p className="text-[#71717B] text-base">
                {t('highlightsCard3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white px-6 md:px-20 lg:px-32 xl:px-48 py-20 min-h-screen flex items-center">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="text-center mb-16">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              {t('howItWorksBadge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.25] mb-4 px-4">
              {t('howItWorksTitle')}
            </h2>
            <p className="text-lg text-[#71717B] max-w-[700px] mx-auto px-4">
              {t('howItWorksSubtitle')}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <button
                onClick={() => setActiveStep(1)}
                className={`bg-white border rounded-2xl p-6 text-left transition-all duration-300 cursor-pointer hover:border-[#09090B] ${
                  activeStep === 1 ? 'opacity-100 border-[#09090B]' : 'opacity-60 border-[#E4E4E7]'
                }`}
              >
                <span className="font-semibold text-sm mr-4">01.</span>
                <h3 className="text-2xl font-medium mb-2 inline">{t('step1Title')}</h3>
                {activeStep === 1 && (
                  <p className="text-[#71717B] text-sm mt-2">
                    {t('step1Desc')}
                  </p>
                )}
              </button>
              <button
                onClick={() => setActiveStep(2)}
                className={`bg-white border rounded-2xl p-6 text-left transition-all duration-300 cursor-pointer hover:border-[#09090B] ${
                  activeStep === 2 ? 'opacity-100 border-[#09090B]' : 'opacity-60 border-[#E4E4E7]'
                }`}
              >
                <span className="font-semibold text-sm mr-4">02.</span>
                <h3 className="text-2xl font-medium mb-2 inline">{t('step2Title')}</h3>
                {activeStep === 2 && (
                  <p className="text-[#71717B] text-sm mt-2">
                    {t('step2Desc')}
                  </p>
                )}
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className={`bg-white border rounded-2xl p-6 text-left transition-all duration-300 cursor-pointer hover:border-[#09090B] ${
                  activeStep === 3 ? 'opacity-100 border-[#09090B]' : 'opacity-60 border-[#E4E4E7]'
                }`}
              >
                <span className="font-semibold text-sm mr-4">03.</span>
                <h3 className="text-2xl font-medium mb-2 inline">{t('step3Title')}</h3>
                {activeStep === 3 && (
                  <p className="text-[#71717B] text-sm mt-2">
                    {t('step3Desc')}
                  </p>
                )}
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className={`bg-white border rounded-2xl p-6 text-left transition-all duration-300 cursor-pointer hover:border-[#09090B] ${
                  activeStep === 4 ? 'opacity-100 border-[#09090B]' : 'opacity-60 border-[#E4E4E7]'
                }`}
              >
                <span className="font-semibold text-sm mr-4">04.</span>
                <h3 className="text-2xl font-medium mb-2 inline">{t('step4Title')}</h3>
                {activeStep === 4 && (
                  <p className="text-[#71717B] text-sm mt-2">
                    {t('step4Desc')}
                  </p>
                )}
              </button>
              <button
                onClick={() => setActiveStep(5)}
                className={`bg-white border rounded-2xl p-6 text-left transition-all duration-300 cursor-pointer hover:border-[#09090B] ${
                  activeStep === 5 ? 'opacity-100 border-[#09090B]' : 'opacity-60 border-[#E4E4E7]'
                }`}
              >
                <span className="font-semibold text-sm mr-4">05.</span>
                <h3 className="text-2xl font-medium mb-2 inline">{t('step5Title')}</h3>
                {activeStep === 5 && (
                  <p className="text-[#71717B] text-sm mt-2">
                    {t('step5Desc')}
                  </p>
                )}
              </button>
            </div>
            <div className="flex-1">
              <div className="w-full h-full min-h-[520px] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detailed Section */}
      <section className="bg-[#FAFAFA] px-6 md:px-20 lg:px-32 xl:px-48 py-20 min-h-screen flex items-center">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="text-center mb-16">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              {t('featuresBadge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.25] mb-4 px-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-lg text-[#71717B] max-w-[700px] mx-auto px-4">
              {t('featuresSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4">
              <div className="w-full h-[324px] bg-gradient-to-br from-[#fa709a] to-[#fee140] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium text-[#27272A] mb-2 px-5">{t('feature1Title')}</h3>
              <p className="text-[#71717B] text-base px-5 pb-5">
                {t('feature1Desc')}
              </p>
            </div>
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4">
              <div className="w-full h-[324px] bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl mb-4"></div>
              <h3 className="text-2xl font-medium text-[#27272A] mb-2 px-5">{t('feature2Title')}</h3>
              <p className="text-[#71717B] text-base px-5 pb-5">
                {t('feature2Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-[#FAFAFA] px-6 md:px-20 lg:px-32 xl:px-48 py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              {t('testimonialsBadge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.25] mb-4 px-4">{t('testimonialsTitle')}</h2>
            <p className="text-lg text-[#71717B] max-w-[700px] mx-auto px-4">
              {t('testimonialsSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[minmax(200px,auto)] gap-6">
            {/* Large testimonial card */}
            <div className="col-span-1 md:col-span-3 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-base leading-[1.5] text-[#09090B] mb-6">
                "{t('testimonial1')}"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <Image src="/avatar1-7324be.png" alt="Marc Manara" width={48} height={48} className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-base text-[#09090B]">Marc Manara</div>
                  <div className="text-base text-[#71717B]">OpenAI</div>
                </div>
              </div>
            </div>

            {/* Stat card 1 */}
            <div className="col-span-1 md:col-span-3 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col gap-4">
              <div className="w-full h-[168px] bg-gradient-to-br from-[#f093fb] to-[#f5576c] rounded-xl"></div>
              <div className="flex flex-col gap-2">
                <div className="text-[32px] font-medium text-[#09090B]">{t('stat1Number')}</div>
                <div className="text-base text-[#71717B] leading-[1.5]">{t('stat1Text')}</div>
              </div>
            </div>

            {/* Medium testimonial card */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-base leading-[1.5] text-[#09090B] mb-6">
                "{t('testimonial2')}"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <Image src="/avatar2-7324be.png" alt="Logan Kilpatrick" width={48} height={48} className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-base text-[#09090B]">Logan Kilpatrick</div>
                  <div className="text-base text-[#71717B]">Google</div>
                </div>
              </div>
            </div>

            {/* Medium testimonial card 2 */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-base leading-[1.5] text-[#09090B] mb-6">
                "{t('testimonial3')}"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <Image src="/avatar3-4171bf.png" alt="Greg Kogan" width={48} height={48} className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-base text-[#09090B]">Greg Kogan</div>
                  <div className="text-base text-[#71717B]">Pinecone</div>
                </div>
              </div>
            </div>

            {/* Stat card 2 */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col gap-4">
              <div className="w-full h-[168px] bg-gradient-to-br from-[#4facfe] to-[#00f2fe] rounded-xl"></div>
              <div className="flex flex-col gap-2">
                <div className="text-[32px] font-medium text-[#09090B]">{t('stat2Number')}</div>
                <div className="text-base text-[#71717B] leading-[1.5]">{t('stat2Text')}</div>
              </div>
            </div>

            {/* Large testimonial card 2 */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-base leading-[1.5] text-[#09090B] mb-6">
                "{t('testimonial4')}"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <Image src="/avatar4-7324be.png" alt="Martin Terskin" width={48} height={48} className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-base text-[#09090B]">Martin Terskin</div>
                  <div className="text-base text-[#71717B]">OfferMarket</div>
                </div>
              </div>
            </div>

            {/* New testimonial card - fills third row */}
            <div className="col-span-1 md:col-span-4 row-span-1 bg-white border border-[#E4E4E7] rounded-2xl p-8 flex flex-col justify-between">
              <p className="text-base leading-[1.5] text-[#09090B] mb-6">
                "{t('testimonial5')}"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <Image src="/avatar5-7324be.png" alt={t('testimonial5Name')} width={48} height={48} className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-base text-[#09090B]">{t('testimonial5Name')}</div>
                  <div className="text-base text-[#71717B]">{t('testimonial5Company')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="bg-[#09090B] px-6 md:px-20 lg:px-32 xl:px-48 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1a1a] to-black opacity-50"></div>
        <div className="max-w-[940px] mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-12">
            <span className="inline-block px-[17px] py-[7px] border border-white/70 rounded-full font-medium text-base mb-4 bg-black/40 text-white/90">
              {t('introBadge')}
            </span>
          </div>
          
          {/* Main Text with Scattered Tags */}
          <div className="relative min-h-[500px] flex items-center justify-center py-12">
            <h2 className="text-center text-3xl md:text-4xl lg:text-5xl -mt-15 leading-[1.3] text-white/80 max-w-[550px] mx-auto relative z-10">
              {t('introText')}
            </h2>
            
            {/* Service Tags - Scattered and Pointing Inward */}
            {/* Strategy - Right Side (pointing left/inward) */}
            <div className="absolute top-[35%] right-0 transform -rotate-6 hidden lg:block">
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#FFD500] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introStrategy')}</span>
              </div>
            </div>
            
            {/* UI/UX - Left Side (pointing right/inward) */}
            <div className="absolute top-[45%] left-0 -translate-y-1/2 transform rotate-5 hidden lg:block">
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#474747] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introUIUX')}</span>
              </div>
            </div>
            
            {/* Prototyping - Right Side (pointing left/inward) */}
            <div className="absolute top-[55%] right-0 transform rotate-8 hidden lg:block">
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#FF45AB] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introPrototyping')}</span>
              </div>
            </div>
            
            {/* Animation - Top Right (pointing down-left/inward) */}
            <div className="absolute top-[15%] right-[2%] transform -rotate-12 hidden lg:block">
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#52FF69] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introAnimation')}</span>
              </div>
            </div>
            
            {/* Research - Left Bottom (pointing up-right/inward) */}
            <div className="absolute bottom-[23%] left-0 transform -rotate-8 hidden lg:block">
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#05A9FF] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introResearch')}</span>
              </div>
            </div>
            
            {/* Design Systems - Left Top (pointing down-right/inward) */}
            <div className="absolute top-[20%] -left-10 transform rotate-12 hidden lg:block">
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#FF5E00] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introDesignSystems')}</span>
              </div>
            </div>
            
            {/* Mobile/Tablet View - Below Text */}
            <div className="flex flex-wrap justify-center gap-4 mt-12 lg:hidden">
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#FFD500] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introStrategy')}</span>
              </div>
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#474747] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introUIUX')}</span>
              </div>
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#FF45AB] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introPrototyping')}</span>
              </div>
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#52FF69] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introAnimation')}</span>
              </div>
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#05A9FF] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introResearch')}</span>
              </div>
              <div className="bg-white rounded-full px-5 py-3 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.3),0px_0px_0px_8px_rgba(255,255,255,0.15)] flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-[#FF5E00] rounded-full"></div>
                <span className="text-sm text-[#09090B]">{t('introDesignSystems')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white px-6 md:px-20 lg:px-32 xl:px-48 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-white opacity-60"></div>
        <div className="max-w-[1400px] mx-auto relative z-10">
          {/* Heading */}
          <div className="text-center mb-10">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              {t('pricingBadge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.25]">
              {t('pricingTitle')}
            </h2>
          </div>

          {/* Pricing Card */}
          <div className="max-w-[800px] mx-auto">
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-10 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.1),0px_0px_0px_8px_rgba(255,255,255,0.25)]">
              <div className="flex flex-col gap-8">
                {/* Top Section */}
                <div>
                  {/* Plan Toggle */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="bg-[#FF5E00] rounded-full w-11 h-6 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.1),0px_0px_0px_3px_rgba(255,255,255,0.25)]">
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <span className="text-2xl font-normal">{t('pricingMonthly')}</span>
                    <span className="text-2xl font-normal text-black/25">{t('pricingCustom')}</span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-[56px] font-normal leading-[1.36] tracking-[-0.065em]">{t('pricingPrice')}</span>
                    <span className="text-[54px] font-light leading-[1.4] tracking-[-0.067em] text-black/25">{t('pricingPerMonth')}</span>
                  </div>
                  
                  {/* Booking Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 bg-[#0CB300] rounded-full"></div>
                    <span className="text-sm font-bold text-black/50">{t('pricingBookingOpen')}</span>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="bg-white rounded-[33px] p-2 inline-block">
                    <button className="bg-[#09090B] text-white px-6 py-3 border-none rounded-full font-bold text-[15px] cursor-pointer shadow-[24px_24px_74.67px_-2.5px_rgba(0,0,0,0.18),inset_0px_-16px_48px_0px_rgba(0,0,0,1)]">
                      {t('pricingBookCall')}
                    </button>
                  </div>
                </div>

                {/* Features Section */}
                <div className="bg-white/75 backdrop-blur-sm rounded-xl p-8">
                  <h3 className="text-lg font-bold mb-4">{t('pricingWhatsIncluded')}</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-black/50">{t('pricingUnlimitedRequests')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-black/50">{t('pricingFastTurnaround')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-black/50">{t('pricingFixedMonthlyRate')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-black/50">{t('pricingAsyncCommunication')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-black/50">{t('pricingFlexibleScope')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-black/50">{t('pricingPauseAnytime')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5"></div>
                <span className="text-xs text-black/50">{t('whyChooseReason1')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5"></div>
                <span className="text-xs text-black/50">{t('whyChooseReason2')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5"></div>
                <span className="text-xs text-black/50">{t('whyChooseReason3')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5"></div>
                <span className="text-xs text-black/50">{t('whyChooseReason4')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5"></div>
                <span className="text-xs text-black/50">{t('whyChooseReason5')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5"></div>
                <span className="text-xs text-black/50">{t('whyChooseReason6')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5"></div>
                <span className="text-xs text-black/50">{t('whyChooseReason7')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5"></div>
                <span className="text-xs text-black/50">{t('whyChooseReason8')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5"></div>
                <span className="text-xs text-black/50">{t('whyChooseReason9')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white px-6 md:px-20 lg:px-32 xl:px-48 py-20">
        <div className="max-w-[1400px] mx-auto">
          {/* Heading */}
          <div className="text-center mb-16">
            <span className="inline-block px-[17px] py-[7px] border border-[#E4E4E7] rounded-full font-medium text-base mb-4 bg-white">
              {t('faqBadge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.25]">
              {t('faqTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
            {/* FAQ Questions */}
            <div className="space-y-0">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <div key={num} className="border-b border-black/25 py-9">
                  <div className="flex items-center justify-between cursor-pointer">
                    <h3 className="text-2xl font-normal">{t(`faqQuestion${num}` as any)}</h3>
                    <div className="w-9 h-9 flex items-center justify-center">
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <path d="M18 12V24M12 18H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Card - Sticky */}
            <div className="lg:w-[600px]">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-10 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.1),0px_0px_0px_8px_rgba(255,255,255,0.25)] lg:sticky lg:top-24">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-[12px_16px_16px_0px_rgba(0,0,0,0.1),0px_0px_0px_8px_rgba(255,255,255,0.25)]"></div>
                  <div>
                    <h3 className="text-2xl font-normal mb-1">{t('faqHaveQuestions')}</h3>
                    <p className="text-2xl font-normal">{t('faqBookCall')}</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-[33px] p-2 mb-6">
                  <button className="w-full bg-[#09090B] text-white px-6 py-3 border-none rounded-full font-bold text-[15px] cursor-pointer shadow-[24px_24px_74.67px_-2.5px_rgba(0,0,0,0.18),inset_0px_-16px_48px_0px_rgba(0,0,0,1)]">
                    {t('faqBookButton')}
                  </button>
                </div>
                
                <p className="text-center text-sm">
                  <span className="text-black/50">{t('faqEmailText')}</span>
                  <a href={`mailto:${t('faqEmail')}`} className="text-[#FF2600] font-bold no-underline">{t('faqEmail')}</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#09090B] text-white px-6 md:px-20 lg:px-32 xl:px-48 pt-24 pb-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-4">
              <div className="text-xl font-semibold">{t('brandName')}</div>
              <p className="text-[#A1A1AA] font-medium">{t('copyright')}</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 md:gap-32">
              <div className="flex flex-col gap-4">
                <h6 className="text-sm font-semibold tracking-[0.1em] text-[#FAFAFA]">{t('footerProduct')}</h6>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerCustomerService')}</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerPricing')}</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerSecurity')}</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerAffiliates')}</a>
              </div>
              <div className="flex flex-col gap-4">
                <h6 className="text-sm font-semibold tracking-[0.1em] text-[#FAFAFA]">{t('footerResources')}</h6>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerContactUs')}</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerAPI')}</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerGuide')}</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerBlog')}</a>
              </div>
              <div className="flex flex-col gap-4">
                <h6 className="text-sm font-semibold tracking-[0.1em] text-[#FAFAFA]">{t('footerCompany')}</h6>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerCareers')}</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerPrivacy')}</a>
                <a href="#" className="text-[#A1A1AA] no-underline text-sm font-semibold hover:text-white">{t('footerTerms')}</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

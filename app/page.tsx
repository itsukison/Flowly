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

      {/* CTA Section */}
      <section className="bg-white px-6 md:px-20 lg:px-32 xl:px-48 py-20 min-h-screen flex items-center">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="relative overflow-hidden text-center py-24 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] rounded-3xl text-white px-10">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">{t('ctaTitle')}</h2>
              <p className="text-lg mb-10 max-w-[600px] mx-auto opacity-95">
                {t('ctaSubtitle')}
              </p>
              <div className="flex flex-col items-center gap-5">
                <button className="bg-white text-[#09090B] px-8 py-4 border-none rounded-full font-bold text-base cursor-pointer shadow-[0px_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0px_6px_30px_rgba(0,0,0,0.25)] transition-all hover:scale-105">
                  {t('ctaButton')}
                </button>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-lg">✓</span>
                  <span className="text-base">{t('ctaNote')}</span>
                </div>
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

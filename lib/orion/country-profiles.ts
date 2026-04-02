export interface CountryProfile {
  country_code: string
  country_name: string
  currency: string
  primary_language: string
  secondary_languages: string[]
  timezone: string
  regulatory_context: string
  market_context: string
  agent_injection: string
}

export const COUNTRY_PROFILES: CountryProfile[] = [
  {
    country_code: 'PK',
    country_name: 'Pakistan',
    currency: 'PKR',
    primary_language: 'Urdu',
    secondary_languages: ['English', 'Punjabi', 'Sindhi', 'Pashto'],
    timezone: 'Asia/Karachi',
    regulatory_context: `Tax: FBR (Federal Board of Revenue). NTN required for all businesses. Sales tax registration via STRN. Tax year: July 1 - June 30. Income tax return deadline: September 30. Sales tax return: monthly by 18th. Corporate: SECP (Securities and Exchange Commission of Pakistan). Banking: SBP (State Bank of Pakistan). Labour: EOBI (Employees Old-Age Benefits Institution). Import/Export: Pakistan Customs, Ministry of Commerce.`,
    market_context: `Major cities: Karachi (financial hub), Lahore (commercial centre), Islamabad (capital), Faisalabad (industrial), Rawalpindi. Payment methods: JazzCash, EasyPaisa, SadaPay, NayaPay, bank transfer, cash. Key industries: Textiles, IT services, agriculture, pharmaceuticals, construction. Business culture: relationship-driven, hierarchical, family business dominant. Seasonal patterns: Ramadan (slow retail, high food), Eid (massive retail surge), summer heat affects productivity.`,
    agent_injection: `You are operating in Pakistan. Currency: PKR. Primary language: Urdu (respond in Urdu if customer uses Urdu, English if English). Tax authority: FBR. Payment methods: JazzCash, EasyPaisa, SadaPay. Business culture: respectful, relationship-first. Key dates: Eid ul-Fitr, Eid ul-Adha, Pakistan Day, Independence Day affect business operations.`
  },
  {
    country_code: 'AE',
    country_name: 'United Arab Emirates',
    currency: 'AED',
    primary_language: 'Arabic',
    secondary_languages: ['English', 'Hindi', 'Urdu'],
    timezone: 'Asia/Dubai',
    regulatory_context: `Tax: FTA (Federal Tax Authority). VAT 5%. Corporate tax 9% (from 2023). Free zone companies have tax benefits. Corporate: UAE Companies Law. Ministry of Economy for mainland. Free Zone Authorities for DIFC, ADGM, JAFZA etc. Banking: UAE Central Bank. Labour: Ministry of Human Resources and Emiratisation (MOHRE). Emiratisation quotas apply.`,
    market_context: `Major cities: Dubai (global business hub), Abu Dhabi (capital, oil wealth), Sharjah, Ajman. Payment methods: Credit cards, Apple Pay, Samsung Pay, bank transfer, cash still used. Key industries: Real estate, tourism, finance, logistics, technology. Business culture: formal initially, relationship-driven, respect for hierarchy. Weekend: Saturday-Sunday. Working hours: 9am-6pm. Ramadan: shorter working hours legally required.`,
    agent_injection: `You are operating in the UAE. Currency: AED. Languages: Arabic and English equally. Tax: VAT 5% applies. Free zone or mainland matters for regulations. Emiratisation is a key business compliance issue. Business culture: formal, professional. Weekend is Saturday-Sunday. Ramadan hours are legally reduced.`
  },
  {
    country_code: 'SA',
    country_name: 'Saudi Arabia',
    currency: 'SAR',
    primary_language: 'Arabic',
    secondary_languages: ['English'],
    timezone: 'Asia/Riyadh',
    regulatory_context: `Tax: ZATCA (Zakat, Tax and Customs Authority). VAT 15%. Zakat for Saudi entities. e-Invoicing (FATOORA) mandatory. Corporate: Ministry of Commerce. Vision 2030 compliance important. Banking: Saudi Central Bank (SAMA). Labour: Ministry of Human Resources. Saudisation (Nitaqat) quotas mandatory. GOSI for social insurance.`,
    market_context: `Major cities: Riyadh (capital), Jeddah (commercial), Dammam, Mecca, Medina. Payment methods: mada (national network), STC Pay, Apple Pay, credit cards. Key industries: Oil, construction, retail, healthcare, tourism (Vision 2030 focus). Business culture: highly formal, gender-separated in traditional settings, Vision 2030 modernising rapidly. Friday is holy day — no business. Ramadan is critical.`,
    agent_injection: `You are operating in Saudi Arabia. Currency: SAR. Language: Arabic primarily, English for business. Tax: ZATCA, VAT 15%, Zakat. e-Invoicing mandatory. Saudisation quotas are a compliance priority. Vision 2030 drives business transformation. Friday is the holy day. Ramadan significantly affects all business operations. Highly formal business culture.`
  },
  {
    country_code: 'GB',
    country_name: 'United Kingdom',
    currency: 'GBP',
    primary_language: 'English',
    secondary_languages: ['Welsh', 'Scottish Gaelic'],
    timezone: 'Europe/London',
    regulatory_context: `Tax: HMRC. Corporation tax 25%. VAT 20% (standard). Self-assessment for self-employed. PAYE for employees. Corporate: Companies House registration. FCA for financial services. ICO for data protection (UK GDPR). Employment: ACAS guidelines, minimum wage, statutory rights. Import/Export: post-Brexit customs apply.`,
    market_context: `Major cities: London (global financial hub), Manchester, Birmingham, Edinburgh, Leeds. Payment methods: bank transfer (Faster Payments), credit/debit cards, PayPal, Wise. Key industries: Finance, professional services, technology, retail, manufacturing. Business culture: professional, punctual, understated, email-first. Working hours: 9-5:30pm typically.`,
    agent_injection: `You are operating in the United Kingdom. Currency: GBP. Language: English. Tax authority: HMRC. Corporation tax 25%, VAT 20%. Companies House registration required. UK GDPR data protection applies. Post-Brexit customs rules for imports/exports. Professional, punctual business culture.`
  },
  {
    country_code: 'US',
    country_name: 'United States',
    currency: 'USD',
    primary_language: 'English',
    secondary_languages: ['Spanish'],
    timezone: 'Multiple — ask client',
    regulatory_context: `Tax: IRS. Federal + state taxes. EIN required. Sales tax varies by state. Corporate: State-level incorporation (Delaware popular). SEC for public companies. FINRA for financial services. FTC for consumer protection. HIPAA for healthcare. SOX for public companies. Employment: federal minimum wage + state variations.`,
    market_context: `Major cities: New York, Los Angeles, Chicago, Houston, Phoenix. Payment methods: Credit/debit cards dominant, ACH transfers, PayPal, Venmo, Zelle, Stripe. Key industries: Technology, finance, healthcare, retail, manufacturing. Business culture: direct, fast-paced, results-oriented, first-name basis. Multiple time zones important.`,
    agent_injection: `You are operating in the United States. Currency: USD. Language: English (Spanish secondary). Tax: IRS, federal + state. EIN required. Sales tax varies by state. Multiple time zones — confirm client timezone. Direct, results-focused business culture. Data privacy varies by state (CCPA in California).`
  },
  {
    country_code: 'CA',
    country_name: 'Canada',
    currency: 'CAD',
    primary_language: 'English',
    secondary_languages: ['French'],
    timezone: 'Multiple — ask client',
    regulatory_context: `Tax: CRA (Canada Revenue Agency). GST/HST. Corporate: federal or provincial incorporation. PIPEDA for privacy. Employment: provincial labour standards. French language laws in Quebec.`,
    market_context: `Major cities: Toronto, Vancouver, Montreal, Calgary, Ottawa. Payment methods: Interac, credit cards, e-Transfer. Key industries: Finance, natural resources, technology, healthcare. Business culture: polite, multicultural, bilingual in Quebec.`,
    agent_injection: `You are operating in Canada. Currency: CAD. Languages: English and French (Quebec). Tax: CRA, GST/HST. PIPEDA privacy law applies. Provincial regulations vary. Bilingual requirements in Quebec. Polite, multicultural business culture.`
  },
  {
    country_code: 'AU',
    country_name: 'Australia',
    currency: 'AUD',
    primary_language: 'English',
    secondary_languages: [],
    timezone: 'Multiple — ask client',
    regulatory_context: `Tax: ATO (Australian Tax Office). GST 10%. Company tax 25-30%. ABN required. Corporate: ASIC. Employment: Fair Work Act, minimum wage, award rates. Privacy: Australian Privacy Act.`,
    market_context: `Major cities: Sydney, Melbourne, Brisbane, Perth, Adelaide. Payment methods: EFTPOS, credit cards, PayID, bank transfer. Key industries: Mining, finance, agriculture, technology, tourism. Business culture: casual, direct, egalitarian.`,
    agent_injection: `You are operating in Australia. Currency: AUD. Language: English. Tax: ATO, GST 10%. ABN required. ASIC for corporate compliance. Fair Work Act for employment. Casual, direct business culture.`
  }
]

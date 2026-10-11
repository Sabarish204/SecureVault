import { Injectable } from '@angular/core';

export interface IndianBank {
  id: number;
  name: string;
  loginUrl: string;
  category?: 'Public Sector' | 'Private Sector' | 'Small Finance' | 'Payments' | 'Foreign' | 'Co-operative' | 'Regional Rural';
  shortCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BankDirectoryService {
  /**
   * Comprehensive list of public, private, small finance, payments, and foreign banks operating in India
   * with their official NetBanking / Internet Banking login portals.
   */
  private banks: IndianBank[] = [
    // --- Public Sector Banks ---
    {
      id: 1,
      name: 'State Bank of India (SBI)',
      loginUrl: 'https://retail.onlinesbi.sbi/retail/login.htm',
      category: 'Public Sector',
      shortCode: 'SBI'
    },
    {
      id: 2,
      name: 'Bank of Baroda',
      loginUrl: 'https://www.bobibanking.com',
      category: 'Public Sector',
      shortCode: 'BOB'
    },
    {
      id: 3,
      name: 'Punjab National Bank (PNB)',
      loginUrl: 'https://iretail.pnb.bank.in/corp/AuthenticationController?FORMSGROUP_ID__=AuthenticationFG&__START_TRAN_FLAG__=Y&__FG_BUTTONS__=LOAD&ACTION.LOAD=Y&AuthenticationFG.LOGIN_FLAG=1&BANK_ID=024',
      category: 'Public Sector',
      shortCode: 'PNB'
    },
    {
      id: 4,
      name: 'Canara Bank',
      loginUrl: 'https://netbanking.canarabank.in/entry/ENULogin.jsp',
      category: 'Public Sector',
      shortCode: 'CNRB'
    },
    {
      id: 5,
      name: 'Union Bank of India',
      loginUrl: 'https://www.unionbankonline.co.in',
      category: 'Public Sector',
      shortCode: 'UBI'
    },
    {
      id: 6,
      name: 'Bank of India',
      loginUrl: 'https://starconnectcbs.bankofindia.com',
      category: 'Public Sector',
      shortCode: 'BOI'
    },
    {
      id: 7,
      name: 'Indian Bank',
      loginUrl: 'https://www.indianbank.net.in',
      category: 'Public Sector',
      shortCode: 'INDB'
    },
    {
      id: 8,
      name: 'Central Bank of India',
      loginUrl: 'https://www.centralbank.net.in',
      category: 'Public Sector',
      shortCode: 'CBI'
    },
    {
      id: 9,
      name: 'Indian Overseas Bank (IOB)',
      loginUrl: 'https://www.iobnet.co.in',
      category: 'Public Sector',
      shortCode: 'IOB'
    },
    {
      id: 10,
      name: 'UCO Bank',
      loginUrl: 'https://www.ucobank.com/english/internet-banking.aspx',
      category: 'Public Sector',
      shortCode: 'UCO'
    },
    {
      id: 11,
      name: 'Bank of Maharashtra',
      loginUrl: 'https://www.mahaconnect.in',
      category: 'Public Sector',
      shortCode: 'BOM'
    },
    {
      id: 12,
      name: 'Punjab & Sind Bank',
      loginUrl: 'https://psbonline.net.in',
      category: 'Public Sector',
      shortCode: 'PSB'
    },

    // --- Private Sector Banks ---
    {
      id: 13,
      name: 'HDFC Bank',
      loginUrl: 'https://netbanking.hdfcbank.com/netbanking/',
      category: 'Private Sector',
      shortCode: 'HDFC'
    },
    {
      id: 14,
      name: 'ICICI Bank',
      loginUrl: 'https://retailnetbanking.icici.bank.in/login-page',
      category: 'Private Sector',
      shortCode: 'ICICI'
    },
    {
      id: 15,
      name: 'Axis Bank',
      loginUrl: 'https://omni.axisbank.co.in/axisretail/',
      category: 'Private Sector',
      shortCode: 'AXIS'
    },
    {
      id: 16,
      name: 'Kotak Mahindra Bank',
      loginUrl: 'https://netbanking.kotak.com/knb2/',
      category: 'Private Sector',
      shortCode: 'KOTAK'
    },
    {
      id: 17,
      name: 'IndusInd Bank',
      loginUrl: 'https://indusnet.indusind.com',
      category: 'Private Sector',
      shortCode: 'INDUS'
    },
    {
      id: 18,
      name: 'Yes Bank',
      loginUrl: 'https://retail.yesbank.in/index.html?module=login',
      category: 'Private Sector',
      shortCode: 'YES'
    },
    {
      id: 19,
      name: 'IDFC FIRST Bank',
      loginUrl: 'https://my.idfcfirstbank.com/login',
      category: 'Private Sector',
      shortCode: 'IDFC'
    },
    {
      id: 20,
      name: 'Federal Bank',
      loginUrl: 'https://www.fednetbank.com',
      category: 'Private Sector',
      shortCode: 'FED'
    },
    {
      id: 21,
      name: 'Bandhan Bank',
      loginUrl: 'https://online.bandhanbank.com',
      category: 'Private Sector',
      shortCode: 'BANDHAN'
    },
    {
      id: 22,
      name: 'RBL Bank',
      loginUrl: 'https://online.rblbank.com',
      category: 'Private Sector',
      shortCode: 'RBL'
    },
    {
      id: 23,
      name: 'South Indian Bank',
      loginUrl: 'https://sibernet.southindianbank.com',
      category: 'Private Sector',
      shortCode: 'SIB'
    },
    {
      id: 24,
      name: 'City Union Bank',
      loginUrl: 'https://www.cityunionbank.com',
      category: 'Private Sector',
      shortCode: 'CUB'
    },
    {
      id: 25,
      name: 'Karur Vysya Bank',
      loginUrl: 'https://www.kvbinfinity.net',
      category: 'Private Sector',
      shortCode: 'KVB'
    },
    {
      id: 26,
      name: 'Karnataka Bank',
      loginUrl: 'https://moneyclick.karnatakabank.com',
      category: 'Private Sector',
      shortCode: 'KBL'
    },
    {
      id: 27,
      name: 'Tamilnad Mercantile Bank (TMB)',
      loginUrl: 'https://www.tmbnet.in',
      category: 'Private Sector',
      shortCode: 'TMB'
    },
    {
      id: 28,
      name: 'IDBI Bank',
      loginUrl: 'https://inet.idbibank.co.in',
      category: 'Private Sector',
      shortCode: 'IDBI'
    },
    {
      id: 29,
      name: 'DCB Bank',
      loginUrl: 'https://dcbonline.dcbbank.com',
      category: 'Private Sector',
      shortCode: 'DCB'
    },
    {
      id: 30,
      name: 'CSB Bank',
      loginUrl: 'https://www.csbnet.co.in',
      category: 'Private Sector',
      shortCode: 'CSB'
    },
    {
      id: 31,
      name: 'Dhanlaxmi Bank',
      loginUrl: 'https://dhanbankonline.com',
      category: 'Private Sector',
      shortCode: 'DHAN'
    },
    {
      id: 32,
      name: 'Jammu & Kashmir Bank (J&K Bank)',
      loginUrl: 'https://www.jkbankonline.com',
      category: 'Private Sector',
      shortCode: 'JKB'
    },

    // --- Small Finance Banks ---
    {
      id: 33,
      name: 'AU Small Finance Bank',
      loginUrl: 'https://au0101.aubank.in',
      category: 'Small Finance',
      shortCode: 'AU'
    },
    {
      id: 34,
      name: 'Equitas Small Finance Bank',
      loginUrl: 'https://inet.equitasbank.com',
      category: 'Small Finance',
      shortCode: 'EQUITAS'
    },
    {
      id: 35,
      name: 'Ujjivan Small Finance Bank',
      loginUrl: 'https://internetbanking.ujjivansfb.in',
      category: 'Small Finance',
      shortCode: 'UJJIVAN'
    },
    {
      id: 36,
      name: 'Jana Small Finance Bank',
      loginUrl: 'https://retail.janabank.com',
      category: 'Small Finance',
      shortCode: 'JANA'
    },
    {
      id: 37,
      name: 'ESAF Small Finance Bank',
      loginUrl: 'https://netbanking.esafbank.com',
      category: 'Small Finance',
      shortCode: 'ESAF'
    },
    {
      id: 38,
      name: 'Capital Small Finance Bank',
      loginUrl: 'https://netbanking.capitalsmallfinancebank.com',
      category: 'Small Finance',
      shortCode: 'CAPITAL'
    },
    {
      id: 39,
      name: 'Suryoday Small Finance Bank',
      loginUrl: 'https://suryodaybank.com',
      category: 'Small Finance',
      shortCode: 'SURYODAY'
    },
    {
      id: 40,
      name: 'Utkarsh Small Finance Bank',
      loginUrl: 'https://www.utkarsh.bank',
      category: 'Small Finance',
      shortCode: 'UTKARSH'
    },

    // --- Payments Banks ---
    {
      id: 41,
      name: 'Airtel Payments Bank',
      loginUrl: 'https://www.airtel.in/bank/',
      category: 'Payments',
      shortCode: 'AIRTEL'
    },
    {
      id: 42,
      name: 'India Post Payments Bank (IPPB)',
      loginUrl: 'https://www.ippbonline.com',
      category: 'Payments',
      shortCode: 'IPPB'
    },
    {
      id: 43,
      name: 'Jio Payments Bank',
      loginUrl: 'https://www.jiopaymentsbank.com',
      category: 'Payments',
      shortCode: 'JIO'
    },
    {
      id: 44,
      name: 'Fino Payments Bank',
      loginUrl: 'https://www.finobank.com',
      category: 'Payments',
      shortCode: 'FINO'
    },
    {
      id: 45,
      name: 'Paytm Payments Bank',
      loginUrl: 'https://www.paytmbank.com',
      category: 'Payments',
      shortCode: 'PAYTM'
    },

    // --- Foreign Banks in India ---
    {
      id: 46,
      name: 'Standard Chartered Bank India',
      loginUrl: 'https://retail.sc.com/in/nfs/login.htm',
      category: 'Foreign',
      shortCode: 'SCB'
    },
    {
      id: 47,
      name: 'Citibank India',
      loginUrl: 'https://www.online.citibank.co.in',
      category: 'Foreign',
      shortCode: 'CITI'
    },
    {
      id: 48,
      name: 'HSBC India',
      loginUrl: 'https://www.hsbc.co.in',
      category: 'Foreign',
      shortCode: 'HSBC'
    },
    {
      id: 49,
      name: 'Deutsche Bank India',
      loginUrl: 'https://www.deutschebank.co.in',
      category: 'Foreign',
      shortCode: 'DB'
    },
    {
      id: 50,
      name: 'DBS Bank India',
      loginUrl: 'https://www.dbs.com/in/index/default.page',
      category: 'Foreign',
      shortCode: 'DBS'
    },

    // --- Additional Private Sector Banks & Card Issuers ---
    {
      id: 51,
      name: 'Nainital Bank',
      loginUrl: 'https://www.nainitalbank.co.in',
      category: 'Private Sector',
      shortCode: 'NTB'
    },
    {
      id: 52,
      name: 'SBM Bank India (State Bank of Mauritius)',
      loginUrl: 'https://www.sbmbank.co.in',
      category: 'Private Sector',
      shortCode: 'SBM'
    },
    {
      id: 53,
      name: 'SBI Card (SBI Cards & Payment Services)',
      loginUrl: 'https://www.sbicard.com',
      category: 'Public Sector',
      shortCode: 'SBICARD'
    },
    {
      id: 54,
      name: 'BOBCARD (BOB Financial Solutions)',
      loginUrl: 'https://www.bobcard.co.in',
      category: 'Public Sector',
      shortCode: 'BOBCARD'
    },
    {
      id: 55,
      name: 'OneCard (FPL Technologies / Partner Banks)',
      loginUrl: 'https://getonecard.app',
      category: 'Private Sector',
      shortCode: 'ONECARD'
    },
    {
      id: 56,
      name: 'Scapia (Federal Bank Co-branded Card)',
      loginUrl: 'https://www.scapia.cards',
      category: 'Private Sector',
      shortCode: 'SCAPIA'
    },

    // --- Additional Small Finance Banks ---
    {
      id: 57,
      name: 'Unity Small Finance Bank',
      loginUrl: 'https://theunitybank.com',
      category: 'Small Finance',
      shortCode: 'UNITY'
    },
    {
      id: 58,
      name: 'Shivalik Small Finance Bank',
      loginUrl: 'https://shivalikbank.com',
      category: 'Small Finance',
      shortCode: 'SHIVALIK'
    },
    {
      id: 59,
      name: 'North East Small Finance Bank',
      loginUrl: 'https://www.nesfb.com',
      category: 'Small Finance',
      shortCode: 'NESFB'
    },
    {
      id: 60,
      name: 'slice (North East SFB Credit Line / Card)',
      loginUrl: 'https://www.sliceit.com',
      category: 'Small Finance',
      shortCode: 'SLICE'
    },
    {
      id: 61,
      name: 'Fincare Small Finance Bank',
      loginUrl: 'https://fincarebank.com',
      category: 'Small Finance',
      shortCode: 'FINCARE'
    },

    // --- Additional Payments Banks ---
    {
      id: 62,
      name: 'NSDL Payments Bank',
      loginUrl: 'https://www.nsdlbank.com',
      category: 'Payments',
      shortCode: 'NSDL'
    },

    // --- Additional Foreign Banks & Card Issuers ---
    {
      id: 63,
      name: 'American Express (Amex)',
      loginUrl: 'https://www.americanexpress.com/en-in/',
      category: 'Foreign',
      shortCode: 'AMEX'
    },
    {
      id: 64,
      name: 'Barclays Bank India',
      loginUrl: 'https://www.barclays.in',
      category: 'Foreign',
      shortCode: 'BARCLAYS'
    },
    {
      id: 65,
      name: 'Bank of America India',
      loginUrl: 'https://www.bankofamerica.com',
      category: 'Foreign',
      shortCode: 'BOA'
    },
    {
      id: 66,
      name: 'J.P. Morgan Chase Bank India',
      loginUrl: 'https://www.jpmorgan.com/IN/en/about-us',
      category: 'Foreign',
      shortCode: 'JPMC'
    },
    {
      id: 67,
      name: 'MUFG Bank India (Mitsubishi UFJ)',
      loginUrl: 'https://www.bk.mufg.jp/global/globalnetwork/asiaoceania/india.html',
      category: 'Foreign',
      shortCode: 'MUFG'
    },
    {
      id: 68,
      name: 'BNP Paribas India',
      loginUrl: 'https://www.bnpparibas.co.in',
      category: 'Foreign',
      shortCode: 'BNP'
    },
    {
      id: 69,
      name: 'Societe Generale India',
      loginUrl: 'https://www.societegenerale.asia/en/countries/india/',
      category: 'Foreign',
      shortCode: 'SOCGEN'
    },
    {
      id: 70,
      name: 'Shinhan Bank India',
      loginUrl: 'https://in.shinhan.com',
      category: 'Foreign',
      shortCode: 'SHINHAN'
    },
    {
      id: 71,
      name: 'Doha Bank India',
      loginUrl: 'https://in.dohabank.com',
      category: 'Foreign',
      shortCode: 'DOHA'
    },
    {
      id: 72,
      name: 'First Abu Dhabi Bank (FAB) India',
      loginUrl: 'https://www.bankfab.com/en-in',
      category: 'Foreign',
      shortCode: 'FAB'
    },
    {
      id: 73,
      name: 'Qatar National Bank (QNB) India',
      loginUrl: 'https://www.qnb.com/sites/qnb/qnbindia/page/en/enhome.html',
      category: 'Foreign',
      shortCode: 'QNB'
    },

    // --- Major Scheduled Urban Co-operative Banks ---
    {
      id: 74,
      name: 'Saraswat Co-operative Bank',
      loginUrl: 'https://www.saraswatbank.com',
      category: 'Co-operative',
      shortCode: 'SARASWAT'
    },
    {
      id: 75,
      name: 'Cosmos Co-operative Bank',
      loginUrl: 'https://www.cosmosbank.com',
      category: 'Co-operative',
      shortCode: 'COSMOS'
    },
    {
      id: 76,
      name: 'SVC Co-operative Bank (Shamrao Vithal)',
      loginUrl: 'https://www.svcbank.com',
      category: 'Co-operative',
      shortCode: 'SVC'
    },
    {
      id: 77,
      name: 'TJSB Sahakari Bank',
      loginUrl: 'https://www.tjsbbank.co.in',
      category: 'Co-operative',
      shortCode: 'TJSB'
    },
    {
      id: 78,
      name: 'Bharat Co-operative Bank',
      loginUrl: 'https://www.bharatbank.com',
      category: 'Co-operative',
      shortCode: 'BHARAT'
    },
    {
      id: 79,
      name: 'Abhyudaya Co-operative Bank',
      loginUrl: 'https://www.abhyudayabank.co.in',
      category: 'Co-operative',
      shortCode: 'ABHYUDAYA'
    },
    {
      id: 80,
      name: 'NKGSB Co-operative Bank',
      loginUrl: 'https://www.nkgsb-bank.com',
      category: 'Co-operative',
      shortCode: 'NKGSB'
    },
    {
      id: 81,
      name: 'Kalupur Commercial Co-operative Bank',
      loginUrl: 'https://www.kalupurbank.com',
      category: 'Co-operative',
      shortCode: 'KALUPUR'
    },
    {
      id: 82,
      name: 'Janata Sahakari Bank (Pune)',
      loginUrl: 'https://www.janatabankpune.com',
      category: 'Co-operative',
      shortCode: 'JSBP'
    },

    // --- Major Regional Rural Banks (RRBs) ---
    {
      id: 83,
      name: 'Kerala Gramin Bank',
      loginUrl: 'https://keralagbank.com',
      category: 'Regional Rural',
      shortCode: 'KGB'
    },
    {
      id: 84,
      name: 'Karnataka Gramin Bank',
      loginUrl: 'https://karnatakagraminbank.com',
      category: 'Regional Rural',
      shortCode: 'KAGB'
    },
    {
      id: 85,
      name: 'Baroda UP Bank',
      loginUrl: 'https://www.barodaupbank.in',
      category: 'Regional Rural',
      shortCode: 'BUPB'
    },
    {
      id: 86,
      name: 'Aryavart Bank',
      loginUrl: 'https://aryavart-rrb.com',
      category: 'Regional Rural',
      shortCode: 'ARYAVART'
    },
    {
      id: 87,
      name: 'Prathama UP Gramin Bank',
      loginUrl: 'https://www.prathamaupbank.com',
      category: 'Regional Rural',
      shortCode: 'PUPB'
    },
    {
      id: 88,
      name: 'Andhra Pragathi Grameena Bank',
      loginUrl: 'https://www.apgb.in',
      category: 'Regional Rural',
      shortCode: 'APGB'
    },
    {
      id: 89,
      name: 'Maharashtra Gramin Bank',
      loginUrl: 'https://www.mahagramin.in',
      category: 'Regional Rural',
      shortCode: 'MGB'
    },
    {
      id: 90,
      name: 'Tamil Nadu Grama Bank',
      loginUrl: 'https://www.tamilnadugramabank.com',
      category: 'Regional Rural',
      shortCode: 'TNGB'
    },
    {
      id: 91,
      name: 'Saurashtra Gramin Bank',
      loginUrl: 'https://sgruralbank.com',
      category: 'Regional Rural',
      shortCode: 'SGB'
    },
    {
      id: 92,
      name: 'Punjab Gramin Bank',
      loginUrl: 'https://pgb.org.in',
      category: 'Regional Rural',
      shortCode: 'PGB'
    },
    {
      id: 93,
      name: 'Chaitanya Godavari Grameena Bank',
      loginUrl: 'https://www.cggb.in',
      category: 'Regional Rural',
      shortCode: 'CGGB'
    },
    {
      id: 94,
      name: 'Telangana Grameena Bank',
      loginUrl: 'https://www.tgbhyd.in',
      category: 'Regional Rural',
      shortCode: 'TGB'
    }
  ];

  /**
   * Retrieves all bank records
   */
  getAllBanks(): IndianBank[] {
    return [...this.banks];
  }

  /**
   * Searches banks by name, short code, or category
   */
  searchBanks(query: string): IndianBank[] {
    if (!query || query.trim() === '') {
      return this.getAllBanks();
    }
    const q = query.toLowerCase().trim();
    return this.banks.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.shortCode && b.shortCode.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q))
    );
  }

  /**
   * Finds a bank by its unique ID
   */
  getBankById(id: number): IndianBank | undefined {
    return this.banks.find(b => b.id === id);
  }

  /**
   * Finds a bank by matching name
   */
  getBankByName(name: string): IndianBank | undefined {
    if (!name) return undefined;
    const cleanName = name.toLowerCase().trim();
    return this.banks.find(b =>
      b.name.toLowerCase() === cleanName ||
      b.name.toLowerCase().includes(cleanName) ||
      cleanName.includes(b.name.toLowerCase())
    );
  }

  /**
   * Adds a new bank to the directory (in-memory extension)
   */
  addBank(bank: Omit<IndianBank, 'id'>): IndianBank {
    const nextId = this.banks.length > 0 ? Math.max(...this.banks.map(b => b.id)) + 1 : 1;
    const newBank: IndianBank = {
      id: nextId,
      ...bank
    };
    this.banks.push(newBank);
    return newBank;
  }

  /**
   * Deletes a bank from the directory by ID
   */
  deleteBank(id: number): boolean {
    const index = this.banks.findIndex(b => b.id === id);
    if (index !== -1) {
      this.banks.splice(index, 1);
      return true;
    }
    return false;
  }
}

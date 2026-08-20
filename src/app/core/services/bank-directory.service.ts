import { Injectable } from '@angular/core';

export interface IndianBank {
  id: number;
  name: string;
  loginUrl: string;
  category?: 'Public Sector' | 'Private Sector' | 'Small Finance' | 'Payments' | 'Foreign';
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
      loginUrl: 'https://netpnb.com',
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

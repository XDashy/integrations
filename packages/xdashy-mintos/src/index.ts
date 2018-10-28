import { unformat } from 'accounting';
import { load } from 'cheerio';
import * as request from 'superagent';

interface IMintosOptions {
  credentials: {
    username: string;
    password: string;
  };
}

export interface IProfileOverview {
  available_funds: number;
  invested_funds: number;
  total: number;
}

export interface IBalance {
  net_annual_return: number;
  interest: number;
  late_payment_fees: number;
  bad_debt: number;
  secondary_market_transactions: number;
  service_fees: number;
  campaign_rewards: number;
  total_profit: number;
}

export interface IOverview {
  balance: IBalance;
  overview: IProfileOverview;
}

const BASE_URL = 'https://www.mintos.com';
const LOGIN_URL = `${BASE_URL}/en/login/check`;
const OVERVIEW_URL = `${BASE_URL}/en/overview`;

export const parseCSRFToken = (document: string): string => {
  const $ = load(document);
  const inputEl$ = $('#login-form input[name="_csrf_token"]').first();

  return inputEl$.val();
};

const cleanNumber = (element: Cheerio): number =>
  unformat(element.text().trim());

export const parseOverviewPage = (document: string): IProfileOverview => {
  const $ = load(document);
  const balanceBoxEl$ = $('#mintos-boxes').children().eq(0);

  return {
    available_funds: cleanNumber(
      balanceBoxEl$.find('tr:nth-child(1) > td:nth-child(2)')
    ),
    invested_funds: cleanNumber(
      balanceBoxEl$.find('tr:nth-child(2) > td:nth-child(2)')
    ),
    total: cleanNumber(
      balanceBoxEl$.find('tr:nth-child(3) > td:nth-child(2)')
    ),
  };
};

export const parseBalanceOverview = (document: string) => {
  const $ = load(document);
  const box$ = $('#mintos-boxes').children().eq(1);

  return {
    net_annual_return: cleanNumber(box$.find('div.header > div')),
    interest: cleanNumber(box$.find('tr:nth-child(1) > td:nth-child(2)')),
    late_payment_fees: cleanNumber(box$.find('tr:nth-child(2) > td:nth-child(2)')),
    bad_debt: cleanNumber(box$.find('tr:nth-child(3) > td:nth-child(2)')),
    secondary_market_transactions: cleanNumber(box$.find('tr:nth-child(4) > td:nth-child(2)')),
    service_fees: cleanNumber(box$.find('tr:nth-child(5) > td:nth-child(2)')),
    campaign_rewards: cleanNumber(box$.find('tr:nth-child(6) > td:nth-child(2)')),
    total_profit: cleanNumber(box$.find('tr.em > td:nth-child(2)')),
  };
};

const getOverview = (document: string): IOverview => ({
  overview: parseOverviewPage(document),
  balance: parseBalanceOverview(document),
});

export const createMintosScraper = (options: IMintosOptions) => {
  const { credentials: { username, password } } = options;

  return {
    scrape: async () => {
      // Get the CSRF from login page
      const agent = request.agent();

      const loginPage = await agent.get(BASE_URL);
      const csrfToken = parseCSRFToken(loginPage.text);

      const formInput = {
        '_csrf_token': csrfToken,
        '_username': username,
        '_password': password,
      };

      await agent.post(LOGIN_URL)
        .type('form')
        .send(formInput);

      const overviewPage = await agent.get(OVERVIEW_URL);
      const overviewPageContent = overviewPage.text;

      return getOverview(overviewPageContent);
    },
  };
};

import * as request from 'superagent';
import { URL } from 'url';
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';
import t, { type, number, exact } from 'io-ts';
import { DateFromArray } from './utils';

export const BASE_URL = new URL('https://www.twino.eu');

export const LOGIN_URL = new URL('/ws/public/login', BASE_URL);
export const ACCOUNT_SUMMARY_URL = new URL('/ws/web/investor/my-account-summary', BASE_URL);

interface TwinoOptions {
  credentials: {
    username: string;
    password: string;
  };
}

interface ProfileOverview {
  deposits: number;
  withdrawals: number;
  xirr: number;
  investment_balance: number;
  loss_on_writeoff: number;
  penalties: number;
  currency_fluctuations: number;
  account_value: number;
  investments: number;
  income: number;
  interest_without_currency_fluctuations: number;
  first_buy_share_date: Date;
}

interface Integration {
  user_profile: ProfileOverview;
  integration: {
    base_url: string;
    overview_url: string;
  },
}

const ProfileOverviewResponse = type({
  deposits: number,
  withdrawals: number,
  xirr: number,
  investmentBalance: number,
  lossOnWriteoff: number,
  penalties: number,
  currencyFluctuations: number,
  accountValue: number,
  investments: number,
  income: number,
  interestWithoutCurrencyFluctuations: number,
  firstBuyShareDate: DateFromArray,
});

const ProfileOverviewExact = exact(ProfileOverviewResponse);
export interface IProfileOverview extends t.TypeOf<typeof ProfileOverviewExact> {}

export const createTwinoScraper = (options: TwinoOptions) => {
  const { credentials } = options;

  const transformOutput = (profile: IProfileOverview) => ({
    deposits: profile.deposits,
    withdrawals: profile.withdrawals,
    xirr: profile.xirr,
    investment_balance: profile.investmentBalance,
    loss_on_writeoff: profile.lossOnWriteoff,
    currency_fluctuations: profile.currencyFluctuations,
    account_value: profile.accountValue,
    investments: profile.investments,
    income: profile.income,
    interest_without_currency_fluctuations: profile.interestWithoutCurrencyFluctuations,
    first_buy_share_date: profile.firstBuyShareDate,
  } as ProfileOverview);

  return {
    scrape: async (): Promise<Integration> => {
      const agent = request.agent();

      const formInput = {
        name: credentials.username,
        password: credentials.password,
      };
      await agent
        .post(LOGIN_URL.toString())
        .send(formInput);

      const summaryPage = await agent.get(ACCOUNT_SUMMARY_URL.toString());

      const decodeResult = ProfileOverviewExact.decode(summaryPage.body);
      ThrowReporter.report(decodeResult);

      if (decodeResult.isLeft()) {
        throw new Error('Failed to decode Twino profile overview response');
      }

      return {
        user_profile: transformOutput(decodeResult.value),
        integration: {
          base_url: BASE_URL.toString(),
          overview_url: ACCOUNT_SUMMARY_URL.toString(),
        },
      };
    },
  };
};

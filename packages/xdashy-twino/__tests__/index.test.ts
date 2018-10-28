import * as nock from 'nock';
import { createTwinoScraper, BASE_URL } from '../src';

describe('Twino', () => {

  beforeAll(() => nock.disableNetConnect());

  it('login and get the user profile overview', async () => {
    nock(BASE_URL.toString())
      .post('/ws/public/login')
        .reply(200, 'OK')
      .get('/ws/web/investor/my-account-summary')
        .replyWithFile(200, `${__dirname}/http/summary.json`, { 'Content-Type': 'application/json' });

    const credentials = {
      username: 'Fill',
      password: 'Cahlll',
    };
    const twino = createTwinoScraper({ credentials });
    const overview = await twino.scrape();

    expect(overview).toMatchSnapshot();
  });
});

// describe('parsing profile overview', () => {
//   const document = fs.readFileSync(`${__dirname}/http/overview-block.html`, 'utf-8');

//   it('parse success case', () => {
//     expect(parseOverviewPage(document)).toMatchSnapshot();
//   });

//   it('parse net annual return overview', () => {
//     expect(parseBalanceOverview(document)).toMatchSnapshot();
//   });
// });

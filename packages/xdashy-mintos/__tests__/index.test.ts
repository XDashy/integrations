import * as nock from 'nock';
import * as fs from 'fs';
import { createMintosScraper, parseOverviewPage, parseBalanceOverview } from '../src';

describe('Mintos', () => {

  it('login and get the user profile overview', async () => {
    nock('https://www.mintos.com')
      .get('/').replyWithFile(200, `${__dirname}/http/base-page.html`)
      .post('/en/login/check').reply(200)
      .get('/en/overview').replyWithFile(200, `${__dirname}/http/overview-page.html`);

    const credentials = {
      username: 'myUsername',
      password: 'myPassword',
    };
    const mintos = createMintosScraper({ credentials });
    const overview = await mintos.scrape();

    expect(overview.balance).toMatchSnapshot();
    expect(overview.overview).toMatchSnapshot();
  });
});

describe('parsing profile overview', () => {
  const document = fs.readFileSync(`${__dirname}/http/overview-block.html`, 'utf-8');

  it('parse success case', () => {
    expect(parseOverviewPage(document)).toMatchSnapshot();
  });

  it('parse net annual return overview', () => {
    expect(parseBalanceOverview(document)).toMatchSnapshot();
  });
});

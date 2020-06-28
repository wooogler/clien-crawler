const ObjectsToCsv = require('objects-to-csv');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

dotenv.config();

const crawler = async () => {
  try{
    const browser = await puppeteer.launch({
      headless: false, 
      args:['--window-size=1920,1080'],
      userDataDir: './user_data'
    })
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    
    page.on('request', (req) => {
      switch (req.resourceType()) {
        case 'stylesheet':
        case 'font':
        case 'image':
          req.abort();
          break;
        default:
          req.continue();
          break;
      }
    });

    await page.setViewport({
      width: 1300, 
      height: 1080,
    })
    await page.goto('https://www.clien.net');
    if (await page.$('.nickname')) {
      console.log('이미 로그인 되어 있음');
    } else {
      await page.type('.input_id', process.env.ID);
      await page.type('.input_pw', process.env.PASSWORD);
      await page.click('.button_submit');
      await page.waitForNavigation();
    }
    await page.goto('https://www.clien.net/service/board/park/15094888');
    // await page.click('.subject_fixed');

    let result = [];
    while(result.length<1000) {
      console.log(result.length);
      try {
        await page.waitForSelector('.button_activity', {timeout: 10000});
        await page.click('.button_activity');
        await page.waitForSelector('.info_title',{ timeout: 10000 });
      } catch (e) {
        console.error(e);
        continue;
      }
      if(!await page.$('.info_title + span')) {
        continue;
      }
      const activity = await page.evaluate(() => {
        const datetime = document.querySelector('.post_author span').innerText.split(' ').splice(0,2).join(' ');
        const id = document.querySelectorAll('.info_title + span')[0].textContent;
        const login = parseInt(
          document.querySelectorAll('.info_title + span')[3].textContent
          .match(/\d+/g)
          .join('')
        );
        const period = parseInt(
          document.querySelectorAll('.info_title + span')[4].textContent
          .match(/\d+/g)
          .join('')
        );
        const agree = parseInt(
          document.querySelectorAll('.info_title + span')[5].textContent
          .match(/\d+/g)
          .join('')
        );
        const report = parseInt(
          document.querySelectorAll('.info_title + span')[6].textContent
          .match(/\d+/g)
          .join('')
        );
        const article = document.querySelector('.user_article') ? 
        parseInt(
          document.querySelector('.user_article')
          .textContent
          .match(/\d+/g)
          .join('')
        ) : 0;
        const article_delete = document.querySelector('.user_article_delete') ? 
        parseInt(
          document.querySelector('.user_article_delete')
          .textContent
          .match(/\d+/g)
          .join('')
        ) : 0;
        const article_admin_delete = document.querySelector('.user_article_admin_delete') ? 
        parseInt(
          document.querySelector('.user_article_admin_delete')
          .textContent
          .match(/\d+/g)
          .join('')
        ) : 0;
        const article_agree = 
          document.querySelector('span.article_symph') ? 
          Math.round(parseFloat(document.querySelector('span.article_symph').style.width)*
          (article+article_delete+article_admin_delete)/100) : 0
        const comment = document.querySelector('.user_comment') ? 
        parseInt(
          document.querySelector('.user_comment')
          .textContent
          .match(/\d+/g)
          .join('')
        ) : 0;
        const comment_delete = document.querySelector('.user_comment_delete') ? 
        parseInt(
          document.querySelector('.user_comment_delete')
          .textContent
          .match(/\d+/g)
          .join('')
        ) : 0;
        const comment_admin_delete = document.querySelector('.user_comment_admin_delete') ? 
        parseInt(
          document.querySelector('.user_comment_admin_delete')
          .textContent
          .match(/\d+/g)
          .join('')
        ) : 0
        const comment_agree = 
          document.querySelector('span.comment_symph') ? 
          Math.round(parseFloat(document.querySelector('span.comment_symph').style.width)*
          (comment+comment_delete+comment_admin_delete)/100) : 0
        return {
          datetime, id, login, period, agree, report,
          article, article_delete, article_admin_delete, article_agree,
          comment, comment_delete, comment_admin_delete, comment_agree,
        }
      });
      console.log(activity);
      result.push(activity);

      
      await page.waitForSelector('.tooltip.next')
      await page.click('.tooltip.next');
      try {
        await page.waitForNavigation({timeout:10000});
      } catch (e) {
        console.error(e);
        continue;
      }
    }
    console.log(result);
    const csv = new ObjectsToCsv(result);
    await csv.toDisk('./clien13.csv');
  } catch(e) {
    console.error(e);
  }
}

crawler();
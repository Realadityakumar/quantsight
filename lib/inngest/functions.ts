import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailler";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";
import { getFormattedTodayDate } from "../utils";

export const sendSignUpEmail = inngest.createFunction(
  {
    id: "sign-up-email",
    triggers: [{ event: "app/user.created" }],
  },
  async ({ event, step }) => {
    const userProfile = `
    - Country: ${event.data.country}
    - Investment Goals: ${event.data.investmentGoals}
    - Risk Tolerance: ${event.data.riskTolerance}
    - Preferred Industry: ${event.data.preferredIndustry}
    `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace("{{userProfile}}",userProfile);

    const response = await step.ai.infer('generate-welcome-intro',{
      model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
      body: {
        contents: [
          {
            role: 'user',
            parts: [
              {text: prompt}
            ]
          }
        ]
      }
    })

    await step.run('send-welcome-email', async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText = (part && 'text' in part ? part.text : null) || "Thanks for joining Quantsight! We're excited to have you on board and look forward to helping you achieve your investment goals.";

      const {data:{email,name}} = event;
      
      return await sendWelcomeEmail({
        email,
        name,
        intro: introText
      });

    })

    return {
      success: true,
      message: "Welcome email sent successfully"
    }
  }
);


export const sendDailyNewsSummary = inngest.createFunction(
  {id: "daily-news-summary",
  triggers: [
      { event: "app/send.daily.news" },
      { cron: "0 12 * * *" }
    ]
  },
  async ({ step }) => {
    type NewsEmailUser = { id: string; email: string; name: string };
    type UserNewsPayload = { user: NewsEmailUser; news: MarketNewsArticle[] };

    // Step #1: Get all users for news delivery
      const users = (await step.run('get-all-users', getAllUsersForNewsEmail)) as NewsEmailUser[];

      if (!users || users.length === 0) return { success: true };

    // Step #2: Fetch personalized news for each user
    const userNews = await step.run('fetch-user-news', async () => {
      const results: UserNewsPayload[] = [];

      for (const user of users) {
        const symbols = await getWatchlistSymbolsByEmail(user.email);
        let news: MarketNewsArticle[] = [];

        try {
          news = await getNews(symbols);
        } catch (error) {
          console.error(`Error fetching news for ${user.email}`, error);
        }

        results.push({ user, news: news.slice(0, 6) });
      }

      return results;
    });

    // Step #3: Summarize news via AI for each user (placeholder)
    
    const userNewsSummaries: { user: NewsEmailUser; newsContent: string | null }[] = [];

    for(const { user, news } of userNews){
      try{
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(news,null,2));

        const response = await step.ai.infer(`summarize-news-${user.email}`,{
          model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
          body: {
            contents: [
              {
                role: 'user',
                parts: [
                  {text: prompt}
                ]
              }
            ]
          }
        })
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent = (part && 'text' in part ?  part.text : null ) || 'No market news';

        userNewsSummaries.push({ user, newsContent });
      }catch(error){
        console.error('Failed to summarize news for user', user.email);
        userNewsSummaries.push({ user, newsContent:  null});
      }
    }

    // Step #4: Send emails (placeholder)
    await step.run('send-news-emails', async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if(!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent
          })
        })
      )
    });

    return { success: true,message: "Daily news summaries sent successfully" };
  }
);

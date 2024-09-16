# Chat with your portfolio using LLMs + Agent Tools

1. **Clone this repository**  
   This project uses a Langchain Nextjs template

   ```bash
   git clone https://github.com/linuxandchill/chat-with-portfolio.git
   ```

2. **Install packages**  
    Install `python` and `js` packages

   ```bash
   cd chat-with-portfolio
   npm i
   ```

   ```bash
   pip install -r requirements.txt
   ```

3. **Add environment variables**  
    Create a `.env.local` file in the root directory that contains your secrets

   `OPENAI_API_KEY='lkasjdflkjasdlkfjalsf'`

   `NEXT_PUBLIC_FLASK_API_URL='this will be created by ngrok or u can just use localhost'`

   If using Robinhood, in your terminal:  
    `export RH_EMAIL='your_rh_email'`  
   `export RH_PW='your_rh_pw'`

4. **Start server**

   ```bash
   python portfolio_server.py
   ```

5. **Start ngrok (optional)**

   ```bash
   ngrok http 5001
   ```

6. **Start Nextjs app**
   ```bash
   npm run dev
   ```

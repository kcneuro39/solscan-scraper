const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const fs = require('fs').promises; // For file I/O

async function extractTransactionLinks() {
  // Launch browser in headless mode
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // List of URLs to process
  const urls = [
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=initializePositionByOperator',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=initializePermissionLbPair',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=addLiquidity',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=addLiquidityByStrategyOneSide',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=addLiquidityOneSide',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=initializePositionPda',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=initializePositionByOperator',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=initializeCustomizablePermissionlessLbPair',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=initializeBinArrayBitmapExtension',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=updatePositionOperator',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=swapWithPriceImpact',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=withdrawProtocolFee',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=initializeReward',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=fundReward',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=updateRewardFunder',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=updateRewardDuration',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=updateFeeParameters',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=increaseOracleLength',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=initializePresetParameter',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=closePresetParameter',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=togglePairStatus',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=migratePosition',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=migrateBinArray',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=withdrawIneligibleReward',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=setActivationPoint',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=addLiquidityOneSidePrecise',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=setPreActivationDuration',
    'https://solscan.io/account/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?instruction=setPreActivationSwapAddress'
  ];
  
  const allTransactionLinks = [];
  
  // Process each URL
  for (const url of urls) {
    const instruction = url.split('instruction=')[1]; // Extract instruction for labeling
    console.log(`Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: 'networkidle2'
    });
    
    let seenTransactions = new Set();
    
    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      console.log(`Processing page ${pageNum} for ${instruction}...`);
      
      // Wait for transaction links to load (with timeout handling)
      try {
        await page.waitForSelector('a.inline-block.text-center.truncate.textLink', { timeout: 10000 });
      } catch (error) {
        console.log(`No transactions found or timeout on page ${pageNum} for ${instruction}, skipping...`);
        break;
      }
      
      // Extract transaction links
      const transactionLinks = await page.evaluate(() => {
        const linkElements = document.querySelectorAll('a.inline-block.text-center.truncate.textLink');
        return Array.from(linkElements).map(a => {
          return {
            transactionId: a.href.split('/tx/')[1],
            fullUrl: a.href // Use the full URL directly from the page
          };
        });
      });
      
      // Filter out duplicates using our Set
      const newLinks = transactionLinks.filter(tx => !seenTransactions.has(tx.transactionId));
      
      console.log(`Found ${transactionLinks.length} transactions on page ${pageNum}, ${newLinks.length} are new`);
      
      // Add new transactions to our results and update seen set
      newLinks.forEach(tx => {
        allTransactionLinks.push({
          instruction: instruction,
          page: pageNum,
          transactionId: tx.transactionId,
          fullUrl: tx.fullUrl // Use the extracted fullUrl as-is, no prefix
        });
        seenTransactions.add(tx.transactionId);
      });
      
      // If not the last page, try to go to next page
      if (pageNum < 3) {
        console.log('Attempting to click next page button...');
        const nextButtonSelector = 'button.inline-flex path[d="m9 18 6-6-6-6"]';
        
        try {
          await page.waitForSelector(nextButtonSelector, { visible: true, timeout: 5000 });
          await page.evaluate(() => {
            const svgPath = document.querySelector('button.inline-flex path[d="m9 18 6-6-6-6"]');
            if (svgPath) {
              const button = svgPath.closest('button');
              if (button && !button.disabled) button.click();
            }
          });
          await new Promise(r => setTimeout(r, 1000)); // Brief wait for page update
          await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 });
        } catch (error) {
          console.log(`No next page available or timeout for ${instruction} at page ${pageNum}, moving to next URL...`);
          break;
        }
      }
    }
  }
  
  // Close the browser
  await browser.close();
  
  // Load previously seen transactions from file
  const seenFilePath = 'seen-transactions.json';
  let previouslySeenTransactions = new Set();
  try {
    const data = await fs.readFile(seenFilePath, 'utf8');
    previouslySeenTransactions = new Set(JSON.parse(data));
    console.log(`Loaded ${previouslySeenTransactions.size} previously seen transactions`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No previous transactions file found, starting fresh');
    } else {
      console.error('Error loading seen transactions:', error);
    }
  }
  
  // Filter out previously seen transactions
  const newTransactionLinks = allTransactionLinks.filter(
    tx => !previouslySeenTransactions.has(tx.transactionId)
  );
  console.log(`Found ${allTransactionLinks.length} total transactions, ${newTransactionLinks.length} are new`);
  
  // Format the links into an HTML email body (only new links)
  let emailBody = '<h3>Solscan Transaction Links</h3><p>Here are the new transaction links you requested, grouped by instruction:</p>';
  
  // Group new links by instruction
  const instructions = [...new Set(newTransactionLinks.map(tx => tx.instruction))];
  for (const instruction of instructions) {
    emailBody += `<h4>${instruction}</h4><ul>`;
    newTransactionLinks
      .filter(tx => tx.instruction === instruction)
      .forEach(tx => {
        emailBody += `<li>Page ${tx.page}: <a href="${tx.fullUrl}">${tx.transactionId}</a></li>`;
      });
    emailBody += '</ul>';
  }
  
  // Only send email if there are new transactions
  if (newTransactionLinks.length > 0) {
    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kyle.txma@gmail.com',
        pass: 'kbumxukhrxlhzoqp' // Your app password
      }
    });
    
    // Email options with HTML body
    const mailOptions = {
      from: 'kyle.txma@gmail.com',
      to: 'kyle.txma@gmail.com',
      subject: 'Solscan Transaction Links',
      html: emailBody
    };
    
    // Send email
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully with ${newTransactionLinks.length} new transactions`);
      
      // Update the seen transactions file with all transactions from this run
      const updatedSeenTransactions = new Set([
        ...previouslySeenTransactions,
        ...allTransactionLinks.map(tx => tx.transactionId)
      ]);
      await fs.writeFile(seenFilePath, JSON.stringify([...updatedSeenTransactions]), 'utf8');
      console.log(`Updated seen transactions file with ${updatedSeenTransactions.size} total entries`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  } else {
    console.log('No new transactions found, skipping email');
  }
}

// Function to run the script and log the start time
async function runScheduledTask() {
  console.log(`Starting transaction check at ${new Date().toLocaleString()}`);
  try {
    await extractTransactionLinks();
  } catch (error) {
    console.error('Scheduled run failed:', error);
  }
}

// Run immediately once, then every hour
runScheduledTask();
setInterval(runScheduledTask, 60 * 60 * 1000); // 60 minutes * 60 seconds * 1000 milliseconds
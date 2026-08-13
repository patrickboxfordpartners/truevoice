#!/usr/bin/env tsx
/**
 * TrueVoice HQ - Interactive Setup Wizard
 *
 * Adapts installation flow based on user's technical skill level
 * and guides them through configuration with validation.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
const ask = (question: string): Promise<string> => {
  return new Promise((resolve) => rl.question(question, resolve));
};

interface SetupAnswers {
  skillLevel: 'beginner' | 'intermediate' | 'expert';
  useCase: 'development' | 'staging' | 'production';
  hasSupabase: boolean;
  hasLiveKit: boolean;
  hasDeepgram: boolean;
  hasStripe: boolean;
  needsHelp: boolean;
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function main() {
  section('🎬 TrueVoice HQ - Interactive Setup Wizard');

  log('Welcome! I\'ll help you set up TrueVoice HQ.', 'cyan');
  log('This will take 5-45 minutes depending on your experience level.\n', 'cyan');

  const answers: Partial<SetupAnswers> = {};

  // Question 1: Skill Level
  section('📊 Step 1: Assess Your Experience');
  log('How would you describe your technical skill level?\n');
  log('1. Beginner    - New to cloud services, need step-by-step guidance');
  log('2. Intermediate - Comfortable with APIs, need some help');
  log('3. Expert      - Know what I\'m doing, just give me the checklist\n');

  const skillAnswer = await ask('Enter 1, 2, or 3: ');
  answers.skillLevel = skillAnswer === '1' ? 'beginner' : skillAnswer === '3' ? 'expert' : 'intermediate';

  // Question 2: Use Case
  section('🎯 Step 2: Deployment Type');
  log('What are you setting up?\n');
  log('1. Development  - Local testing, free tiers');
  log('2. Staging      - Pre-production testing');
  log('3. Production   - Live customer-facing deployment\n');

  const useCaseAnswer = await ask('Enter 1, 2, or 3: ');
  answers.useCase = useCaseAnswer === '1' ? 'development' : useCaseAnswer === '3' ? 'production' : 'staging';

  // Question 3: Service Accounts
  section('☁️  Step 3: Service Accounts');
  log('Do you already have accounts for these services?\n');

  answers.hasSupabase = (await ask('Supabase account? (y/n): ')).toLowerCase() === 'y';
  answers.hasLiveKit = (await ask('LiveKit account? (y/n): ')).toLowerCase() === 'y';
  answers.hasDeepgram = (await ask('Deepgram account? (y/n): ')).toLowerCase() === 'y';

  if (answers.useCase !== 'development') {
    answers.hasStripe = (await ask('Stripe account? (y/n): ')).toLowerCase() === 'y';
  } else {
    answers.hasStripe = false;
  }

  // Assess setup complexity
  section('🧮 Analyzing Setup Complexity');

  const missingServices = [
    !answers.hasSupabase && 'Supabase',
    !answers.hasLiveKit && 'LiveKit',
    !answers.hasDeepgram && 'Deepgram',
    !answers.hasStripe && answers.useCase !== 'development' && 'Stripe',
  ].filter(Boolean);

  const estimatedTime = calculateSetupTime(answers as SetupAnswers);
  const complexity = getComplexity(answers as SetupAnswers);

  log(`Estimated setup time: ${estimatedTime}`, 'yellow');
  log(`Complexity: ${complexity}`, complexity === 'HIGH' ? 'red' : complexity === 'MEDIUM' ? 'yellow' : 'green');

  if (missingServices.length > 0) {
    log(`\nYou'll need to create accounts for: ${missingServices.join(', ')}`, 'yellow');
  }

  // Offer installation services for complex setups
  if (shouldOfferServices(answers as SetupAnswers)) {
    section('💼 Professional Installation Services Available');

    log('Based on your setup complexity, you may want to consider our installation services:\n', 'cyan');

    if (answers.skillLevel === 'beginner' || complexity === 'HIGH') {
      log('🎯 RECOMMENDED FOR YOU:', 'bright');
      if (answers.useCase === 'production') {
        log('\n📦 WHITE GLOVE SETUP - $1,500 one-time', 'green');
        log('  ✓ We set up everything for you');
        log('  ✓ 2-hour setup call + screen share');
        log('  ✓ All services configured and tested');
        log('  ✓ Custom domain and SSL setup');
        log('  ✓ Team training session (up to 5 people)');
        log('  ✓ 30 days of priority support');
        log('  ✓ Setup completed in 1 business day\n');
      } else {
        log('\n🤝 GUIDED SETUP - $499 one-time', 'green');
        log('  ✓ 1-hour guided setup call');
        log('  ✓ We walk you through each step');
        log('  ✓ Environment verification');
        log('  ✓ Help creating service accounts');
        log('  ✓ 14 days of email support\n');
      }
    }

    log('Other options:');
    log('  • DIY Installation (Free) - Follow documentation');
    log('  • Community Support (Free) - GitHub Discussions + Discord\n');

    const wantsHelp = await ask('Would you like information about professional setup? (y/n): ');
    answers.needsHelp = wantsHelp.toLowerCase() === 'y';

    if (answers.needsHelp) {
      showInstallationServices(answers as SetupAnswers);
      const proceed = await ask('\nWould you still like to proceed with self-installation? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        log('\n✋ Setup paused. Contact sales@boxfordpartners.com to schedule installation.', 'cyan');
        rl.close();
        return;
      }
    }
  }

  // Generate setup plan based on skill level
  section('📋 Generating Your Custom Setup Plan');

  const plan = generateSetupPlan(answers as SetupAnswers);

  log('Your personalized setup checklist:\n', 'bright');
  plan.forEach((step, idx) => {
    log(`${idx + 1}. ${step.title}`, 'cyan');
    if (answers.skillLevel !== 'expert') {
      log(`   ${step.description}`, 'reset');
      log(`   Estimated: ${step.time}\n`, 'yellow');
    }
  });

  // Ask if ready to proceed
  const ready = await ask('\nReady to start installation? (y/n): ');

  if (ready.toLowerCase() !== 'y') {
    log('\n✋ Setup paused. Run this script again when ready.', 'cyan');
    rl.close();
    return;
  }

  // Start automated setup
  section('🚀 Starting Automated Setup');

  await runAutomatedSetup(answers as SetupAnswers);

  rl.close();
}

function calculateSetupTime(answers: SetupAnswers): string {
  let minutes = 15; // Base time

  if (answers.skillLevel === 'beginner') minutes += 30;
  if (answers.skillLevel === 'intermediate') minutes += 15;

  if (!answers.hasSupabase) minutes += 10;
  if (!answers.hasLiveKit) minutes += 10;
  if (!answers.hasDeepgram) minutes += 5;
  if (!answers.hasStripe) minutes += 15;

  if (answers.useCase === 'production') minutes += 20;

  return `${minutes}-${minutes + 15} minutes`;
}

function getComplexity(answers: SetupAnswers): 'LOW' | 'MEDIUM' | 'HIGH' {
  let score = 0;

  if (answers.skillLevel === 'beginner') score += 2;
  if (answers.skillLevel === 'intermediate') score += 1;

  if (!answers.hasSupabase) score += 2;
  if (!answers.hasLiveKit) score += 1;
  if (!answers.hasDeepgram) score += 1;
  if (!answers.hasStripe && answers.useCase !== 'development') score += 2;

  if (answers.useCase === 'production') score += 2;

  if (score >= 6) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
}

function shouldOfferServices(answers: SetupAnswers): boolean {
  // Offer services for beginners, production deployments, or complex setups
  return (
    answers.skillLevel === 'beginner' ||
    answers.useCase === 'production' ||
    getComplexity(answers) === 'HIGH'
  );
}

function showInstallationServices(answers: SetupAnswers) {
  section('💼 Installation Service Options');

  log('📦 WHITE GLOVE SETUP - $1,500 one-time', 'green');
  log('━'.repeat(60));
  log('Perfect for production deployments and teams');
  log('');
  log('What\'s Included:');
  log('  ✓ Full environment setup (all services configured)');
  log('  ✓ 2-hour interactive setup call with screenshare');
  log('  ✓ Database migrations applied and verified');
  log('  ✓ Edge functions deployed and tested');
  log('  ✓ Stripe products and webhooks configured');
  log('  ✓ Custom domain + SSL certificate setup');
  log('  ✓ Security audit (rate limiting, CORS, auth)');
  log('  ✓ End-to-end testing of interview flow');
  log('  ✓ Team training session (up to 5 people)');
  log('  ✓ 30 days of priority email + Slack support');
  log('  ✓ Setup completed within 1 business day');
  log('');
  log('👥 Best for: Production deployments, teams, enterprises');
  log('');

  log('🤝 GUIDED SETUP - $499 one-time', 'cyan');
  log('━'.repeat(60));
  log('Perfect for developers who want expert guidance');
  log('');
  log('What\'s Included:');
  log('  ✓ 1-hour guided setup call');
  log('  ✓ We walk you through each step');
  log('  ✓ Help creating and configuring service accounts');
  log('  ✓ Environment variable verification');
  log('  ✓ Basic functionality testing');
  log('  ✓ 14 days of email support');
  log('');
  log('👤 Best for: Solo developers, staging environments');
  log('');

  log('🆓 DIY INSTALLATION - Free', 'yellow');
  log('━'.repeat(60));
  log('Perfect for experienced developers');
  log('');
  log('What\'s Included:');
  log('  ✓ Comprehensive documentation (INSTALLATION.md)');
  log('  ✓ This interactive setup wizard');
  log('  ✓ Automated validation scripts');
  log('  ✓ Community support (GitHub + Discord)');
  log('  ✓ Public issue tracking');
  log('');
  log('🧑‍💻 Best for: Development, experienced teams');
  log('');

  log('📞 To schedule professional setup:', 'bright');
  log('   Email: sales@boxfordpartners.com');
  log('   Subject: "TrueVoice Setup - [White Glove/Guided]"');
  log('   Or visit: https://truevoicehq.com/setup\n');
}

interface SetupStep {
  title: string;
  description: string;
  time: string;
  command?: string;
}

function generateSetupPlan(answers: SetupAnswers): SetupStep[] {
  const plan: SetupStep[] = [];

  // Step 1: Install dependencies
  plan.push({
    title: 'Install dependencies',
    description: 'npm install to get all required packages',
    time: '2-3 min',
    command: 'npm install',
  });

  // Step 2: Environment setup
  if (!answers.hasSupabase || !answers.hasLiveKit || !answers.hasDeepgram) {
    plan.push({
      title: 'Create service accounts',
      description: 'Set up Supabase, LiveKit, and Deepgram accounts',
      time: '10-15 min',
    });
  }

  plan.push({
    title: 'Configure environment variables',
    description: 'Create .env.local with your API keys',
    time: '5-10 min',
  });

  // Step 3: Database setup
  plan.push({
    title: 'Initialize database',
    description: 'Link Supabase project and run migrations',
    time: '3-5 min',
    command: 'supabase link && supabase db push',
  });

  // Step 4: Deploy edge functions
  plan.push({
    title: 'Deploy edge functions',
    description: 'Deploy all Supabase edge functions',
    time: '5-7 min',
    command: 'supabase functions deploy --all',
  });

  // Step 5: Stripe setup (if production)
  if (answers.useCase !== 'development') {
    plan.push({
      title: 'Configure Stripe',
      description: 'Create products, prices, and webhooks',
      time: '10-15 min',
      command: 'npm run stripe:setup',
    });
  }

  // Step 6: Test locally
  plan.push({
    title: 'Test locally',
    description: 'Run dev server and verify core functionality',
    time: '5-10 min',
    command: 'npm run dev',
  });

  // Step 7: Deploy (if not development)
  if (answers.useCase !== 'development') {
    plan.push({
      title: 'Deploy to production',
      description: 'Deploy to Vercel and configure custom domain',
      time: '10-15 min',
      command: 'vercel --prod',
    });
  }

  return plan;
}

async function runAutomatedSetup(answers: SetupAnswers) {
  try {
    // Check if we're in the right directory
    if (!existsSync('./package.json')) {
      log('❌ Error: package.json not found. Run this from the project root.', 'red');
      return;
    }

    log('Step 1/7: Checking dependencies...', 'cyan');

    // Check if node_modules exists
    if (!existsSync('./node_modules')) {
      log('Installing dependencies... (this may take a few minutes)', 'yellow');
      execSync('npm install', { stdio: 'inherit' });
      log('✓ Dependencies installed', 'green');
    } else {
      log('✓ Dependencies already installed', 'green');
    }

    log('\nStep 2/7: Environment configuration...', 'cyan');

    // Check if .env.local exists
    if (!existsSync('./.env.local')) {
      if (existsSync('./.env.example')) {
        execSync('cp .env.example .env.local');
        log('✓ Created .env.local from template', 'green');
        log('⚠️  ACTION REQUIRED: Edit .env.local with your API keys', 'yellow');
      } else {
        log('⚠️  WARNING: No .env.example found', 'yellow');
      }
    } else {
      log('✓ .env.local already exists', 'green');
    }

    log('\nStep 3/7: Checking Supabase CLI...', 'cyan');

    try {
      execSync('supabase --version', { stdio: 'pipe' });
      log('✓ Supabase CLI is installed', 'green');
    } catch {
      log('⚠️  Supabase CLI not found', 'yellow');
      log('   Install with: npm install -g supabase', 'yellow');
    }

    // Provide next steps based on skill level
    section('✅ Automated Setup Complete!');

    if (answers.skillLevel === 'beginner') {
      log('Next steps (follow in order):\n', 'bright');
      log('1. Edit .env.local file:', 'cyan');
      log('   - Add your Supabase URL and keys');
      log('   - Add LiveKit credentials');
      log('   - Add Deepgram API key');
      log('');
      log('2. Link your Supabase project:', 'cyan');
      log('   supabase link --project-ref YOUR_PROJECT_REF');
      log('');
      log('3. Apply database migrations:', 'cyan');
      log('   supabase db push');
      log('');
      log('4. Deploy edge functions:', 'cyan');
      log('   supabase functions deploy --all');
      log('');
      log('5. Start the dev server:', 'cyan');
      log('   npm run dev');
      log('');
      log('📖 Full guide: See INSTALLATION.md for detailed instructions', 'yellow');
    } else {
      log('Next: Complete INSTALLATION.md steps 2-6', 'cyan');
      log('Quick reference:', 'yellow');
      log('  1. Configure .env.local');
      log('  2. supabase link && supabase db push');
      log('  3. supabase functions deploy --all');
      log('  4. supabase secrets set DEEPGRAM_API_KEY="..."');
      log('  5. npm run dev');
    }

  } catch (error) {
    log(`\n❌ Error during setup: ${error}`, 'red');
  }
}

// Run the wizard
main().catch((error) => {
  log(`\nFatal error: ${error}`, 'red');
  process.exit(1);
});

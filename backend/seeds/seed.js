require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS governance_compliance CASCADE;
      DROP TABLE IF EXISTS social_impacts CASCADE;
      DROP TABLE IF EXISTS energy_audits CASCADE;
      DROP TABLE IF EXISTS water_usage CASCADE;
      DROP TABLE IF EXISTS biodiversity_impacts CASCADE;
      DROP TABLE IF EXISTS climate_scenarios CASCADE;
      DROP TABLE IF EXISTS data_validations CASCADE;
      DROP TABLE IF EXISTS stakeholder_reports CASCADE;
      DROP TABLE IF EXISTS greenwashing_checks CASCADE;
      DROP TABLE IF EXISTS risk_assessments CASCADE;
      DROP TABLE IF EXISTS supply_chain_esg CASCADE;
      DROP TABLE IF EXISTS regulatory_compliance CASCADE;
      DROP TABLE IF EXISTS sustainability_metrics CASCADE;
      DROP TABLE IF EXISTS carbon_footprints CASCADE;
      DROP TABLE IF EXISTS esg_reports CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // ── CREATE TABLES ──────────────────────────────────────────────────

    console.log('Creating tables...');

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE esg_reports (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255),
        report_title VARCHAR(255),
        reporting_period VARCHAR(100),
        framework VARCHAR(50),
        environmental_score DECIMAL,
        social_score DECIMAL,
        governance_score DECIMAL,
        overall_rating VARCHAR(10),
        status VARCHAR(50),
        summary TEXT,
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE carbon_footprints (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255),
        reporting_year INT,
        scope1_emissions DECIMAL,
        scope2_emissions DECIMAL,
        scope3_emissions DECIMAL,
        total_emissions DECIMAL,
        reduction_target_pct DECIMAL,
        baseline_year INT,
        industry_sector VARCHAR(100),
        methodology VARCHAR(100),
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE sustainability_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(255),
        category VARCHAR(50),
        current_value DECIMAL,
        target_value DECIMAL,
        unit VARCHAR(50),
        trend VARCHAR(20),
        measurement_period VARCHAR(50),
        data_source VARCHAR(100),
        confidence_level DECIMAL,
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE regulatory_compliance (
        id SERIAL PRIMARY KEY,
        regulation_name VARCHAR(255),
        jurisdiction VARCHAR(100),
        compliance_status VARCHAR(50),
        due_date DATE,
        last_audit_date DATE,
        risk_level VARCHAR(20),
        responsible_party VARCHAR(255),
        description TEXT,
        penalty_amount DECIMAL,
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE supply_chain_esg (
        id SERIAL PRIMARY KEY,
        supplier_name VARCHAR(255),
        country VARCHAR(100),
        industry VARCHAR(100),
        esg_score DECIMAL,
        environmental_rating VARCHAR(2),
        social_rating VARCHAR(2),
        governance_rating VARCHAR(2),
        risk_level VARCHAR(20),
        audit_date DATE,
        certification VARCHAR(100),
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE risk_assessments (
        id SERIAL PRIMARY KEY,
        risk_name VARCHAR(255),
        category VARCHAR(50),
        likelihood VARCHAR(20),
        impact_level VARCHAR(20),
        risk_score DECIMAL,
        mitigation_strategy TEXT,
        owner VARCHAR(255),
        review_date DATE,
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE greenwashing_checks (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255),
        claim_text TEXT,
        claim_source VARCHAR(255),
        verification_status VARCHAR(50),
        confidence_score DECIMAL,
        evidence_found TEXT,
        category VARCHAR(50),
        severity VARCHAR(20),
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE stakeholder_reports (
        id SERIAL PRIMARY KEY,
        report_title VARCHAR(255),
        stakeholder_group VARCHAR(50),
        report_type VARCHAR(50),
        fiscal_year INT,
        key_highlights TEXT,
        material_topics TEXT,
        engagement_score DECIMAL,
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE data_validations (
        id SERIAL PRIMARY KEY,
        dataset_name VARCHAR(255),
        data_source VARCHAR(255),
        validation_type VARCHAR(50),
        records_checked INT,
        errors_found INT,
        error_rate DECIMAL,
        severity VARCHAR(20),
        issues_description TEXT,
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE climate_scenarios (
        id SERIAL PRIMARY KEY,
        scenario_name VARCHAR(255),
        temperature_pathway VARCHAR(10),
        time_horizon VARCHAR(10),
        physical_risk_level VARCHAR(20),
        transition_risk_level VARCHAR(20),
        financial_impact_millions DECIMAL,
        sector VARCHAR(100),
        assumptions TEXT,
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE biodiversity_impacts (
        id SERIAL PRIMARY KEY,
        project_name VARCHAR(255),
        location VARCHAR(255),
        ecosystem_type VARCHAR(50),
        species_affected INT,
        habitat_area_hectares DECIMAL,
        impact_type VARCHAR(20),
        mitigation_measures TEXT,
        biodiversity_score DECIMAL,
        monitoring_frequency VARCHAR(50),
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE water_usage (
        id SERIAL PRIMARY KEY,
        facility_name VARCHAR(255),
        location VARCHAR(255),
        water_source VARCHAR(50),
        consumption_cubic_meters DECIMAL,
        discharge_cubic_meters DECIMAL,
        recycled_pct DECIMAL,
        water_stress_level VARCHAR(20),
        quality_index DECIMAL,
        reduction_target_pct DECIMAL,
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE energy_audits (
        id SERIAL PRIMARY KEY,
        facility_name VARCHAR(255),
        audit_date DATE,
        total_consumption_kwh DECIMAL,
        renewable_pct DECIMAL,
        efficiency_rating VARCHAR(2),
        carbon_intensity DECIMAL,
        cost_per_kwh DECIMAL,
        annual_cost DECIMAL,
        savings_potential_pct DECIMAL,
        recommendations TEXT,
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE social_impacts (
        id SERIAL PRIMARY KEY,
        program_name VARCHAR(255),
        category VARCHAR(50),
        beneficiaries_count INT,
        investment_amount DECIMAL,
        impact_score DECIMAL,
        measurement_method VARCHAR(100),
        location VARCHAR(255),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE governance_compliance (
        id SERIAL PRIMARY KEY,
        policy_name VARCHAR(255),
        category VARCHAR(50),
        compliance_level DECIMAL,
        last_review_date DATE,
        next_review_date DATE,
        responsible_officer VARCHAR(255),
        violations_count INT,
        training_completion_pct DECIMAL,
        risk_rating VARCHAR(20),
        status VARCHAR(50),
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── SEED DATA ──────────────────────────────────────────────────────

    console.log('Seeding data...');

    // 1. users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
        ('admin@esgreporter.com', $1, 'Admin User', 'admin');
    `, [hashedPassword]);

    // 2. esg_reports
    await client.query(`
      INSERT INTO esg_reports (company_name, report_title, reporting_period, framework, environmental_score, social_score, governance_score, overall_rating, status, summary, ai_analysis, user_id) VALUES
        ('Unilever PLC', 'Annual Sustainability Report 2025', 'FY 2025', 'GRI', 92.4, 88.7, 91.2, 'A+', 'published', 'Comprehensive sustainability report covering environmental stewardship, social responsibility, and corporate governance across global operations.', 'Strong performance across all ESG dimensions. Environmental initiatives show 12% YoY improvement in emissions reduction. Social programs reach 2.3M beneficiaries globally.', 1),
        ('Tesla Inc', 'Impact Report 2025', 'FY 2025', 'SASB', 87.3, 62.5, 58.9, 'B+', 'published', 'Impact report focused on clean energy transition, vehicle safety, and workforce development.', 'Excellent environmental scores driven by EV production. Social and governance scores lag due to labor controversies and board independence concerns.', 1),
        ('HSBC Holdings', 'ESG Disclosure Report Q4 2025', 'Q4 2025', 'TCFD', 71.8, 79.3, 85.6, 'B+', 'review', 'Climate-related financial disclosures aligned with TCFD recommendations for banking operations.', 'Transition risk management is well-documented. Physical risk assessment needs expansion to cover emerging market exposures.', 1),
        ('Nestle SA', 'Creating Shared Value Report 2025', 'FY 2025', 'GRI', 78.2, 83.1, 80.5, 'B+', 'published', 'Report on sustainable sourcing, nutrition commitments, and water stewardship programs.', 'Water stewardship programs show measurable impact. Deforestation-free supply chain target at 94.2% achievement.', 1),
        ('BP PLC', 'Sustainability Report 2025', 'FY 2025', 'CDP', 54.7, 72.3, 69.8, 'C', 'published', 'Sustainability report covering energy transition strategy, emissions reduction, and just transition commitments.', 'Emissions reduction targets are ambitious but execution is behind schedule. Scope 3 reporting remains incomplete for downstream operations.', 1),
        ('Microsoft Corp', 'Environmental Sustainability Report 2025', 'FY 2025', 'GRI', 94.1, 91.5, 93.8, 'A+', 'published', 'Comprehensive report on carbon negative pledge, water positive strategy, and digital inclusion.', 'Industry-leading environmental commitments backed by measurable progress. Carbon removal portfolio is the most diversified in tech sector.', 1),
        ('Amazon.com Inc', 'Climate Pledge Progress Report 2025', 'FY 2025', 'CDP', 68.9, 58.4, 61.2, 'B', 'review', 'Progress report on Climate Pledge commitments including fleet electrification and renewable energy.', 'Renewable energy procurement is strong but last-mile delivery emissions remain challenging. Warehouse worker safety metrics need improvement.', 1),
        ('Rio Tinto Group', 'Sustainable Development Report 2025', 'FY 2025', 'SASB', 52.3, 64.8, 72.1, 'C', 'published', 'Report on mine rehabilitation, community partnerships, and water management in extractive operations.', 'Heritage site management improvements noted. Tailings dam safety protocols upgraded. Community investment up 18% but indigenous rights issues persist.', 1),
        ('Siemens AG', 'Sustainability Information 2025', 'FY 2025', 'GRI', 88.6, 85.2, 87.4, 'A', 'published', 'Integrated sustainability report covering DEGREE framework targets across environmental, social, and governance areas.', 'DEGREE framework provides clear KPI tracking. Supply chain decarbonization program covers 75% of Tier 1 suppliers.', 1),
        ('JPMorgan Chase', 'ESG Report 2025', 'FY 2025', 'TCFD', 65.4, 78.9, 82.3, 'B', 'published', 'ESG report covering sustainable finance commitments, climate risk integration, and DEI initiatives.', 'Sustainable finance commitments are substantial at $2.5T target. Financed emissions measurement methodology needs standardization.', 1),
        ('Novartis AG', 'ESG Report 2025', 'FY 2025', 'ISSB', 83.7, 90.2, 86.5, 'A', 'review', 'Report on access to medicine, clinical trial diversity, and environmental footprint of pharmaceutical manufacturing.', 'Access to medicine programs reach 79 LMICs. Clinical trial diversity improved 23%. Manufacturing emissions reduction on track.', 1),
        ('TotalEnergies SE', 'Sustainability and Climate Progress Report 2025', 'FY 2025', 'CDP', 48.9, 67.4, 63.2, 'C', 'draft', 'Progress report on multi-energy strategy, renewable capacity expansion, and methane emissions reduction.', 'Renewable capacity growing but fossil fuel production has not peaked. Methane intensity improved 31% since 2020.', 1),
        ('Samsung Electronics', 'Sustainability Report 2025', 'FY 2025', 'GRI', 76.5, 71.8, 74.3, 'B', 'published', 'Report on eco-conscious products, circular economy initiatives, and supply chain labor standards.', 'Circular economy initiatives are expanding. Conflict minerals due diligence covers 100% of identified smelters. Energy efficiency in chip fabrication improved.', 1),
        ('Volkswagen Group', 'Group Sustainability Report 2025', 'FY 2025', 'ISSB', 72.1, 68.9, 65.7, 'B', 'review', 'Report on EV transition, battery lifecycle management, and supply chain human rights due diligence.', 'EV portfolio expansion is on track. Battery recycling pilot shows 92% material recovery. Xinjiang supply chain audit findings need resolution.', 1),
        ('Apple Inc', 'Environmental Progress Report 2025', 'FY 2025', 'GRI', 96.2, 82.4, 79.8, 'A', 'published', 'Report on carbon neutral product lifecycle, supplier clean energy program, and recycled materials usage.', 'Carbon neutral product goal achieved for Apple Watch and MacBook Air. Supplier clean energy program covers 320+ suppliers. Cobalt sourcing transparency improved.', 1);
    `);

    // 3. carbon_footprints
    await client.query(`
      INSERT INTO carbon_footprints (company_name, reporting_year, scope1_emissions, scope2_emissions, scope3_emissions, total_emissions, reduction_target_pct, baseline_year, industry_sector, methodology, status, ai_analysis, user_id) VALUES
        ('Unilever PLC', 2025, 1245.8, 892.3, 24567.4, 26705.5, 50.0, 2015, 'Consumer Goods', 'GHG Protocol', 'verified', 'Scope 1 emissions reduced 32% from baseline. Scope 3 remains dominant at 92% of total footprint. Agricultural supply chain is the primary contributor.', 1),
        ('Tesla Inc', 2025, 312.5, 1876.4, 8934.2, 11123.1, 100.0, 2020, 'Automotive', 'GHG Protocol', 'verified', 'Manufacturing energy consumption drives Scope 2. Gigafactory solar installations offset 45% of electricity demand. Battery production supply chain is Scope 3 hotspot.', 1),
        ('HSBC Holdings', 2025, 42.7, 187.3, 65432.1, 65662.1, 34.0, 2019, 'Financial Services', 'GHG Protocol', 'calculated', 'Financed emissions dominate total footprint. Portfolio alignment with Paris Agreement at 62%. Coal financing phase-out on track for 2028.', 1),
        ('Shell PLC', 2025, 52340.6, 8920.4, 312450.8, 373711.8, 30.0, 2016, 'Oil & Gas', 'ISO 14064', 'reported', 'Upstream operations account for 78% of Scope 1. Flaring reduction program achieved 40% decrease. LNG transition reducing lifecycle emissions per unit energy.', 1),
        ('Microsoft Corp', 2025, 124.8, 2345.6, 12567.9, 15038.3, 100.0, 2020, 'Technology', 'GHG Protocol', 'verified', 'Carbon negative by 2030 on track. Internal carbon fee of $15/tonne driving behavioral change. Cloud data center PUE at 1.12 industry-leading efficiency.', 1),
        ('Nestle SA', 2025, 3456.7, 1234.5, 45678.9, 50370.1, 50.0, 2018, 'Food & Beverage', 'CDP', 'verified', 'Dairy supply chain accounts for 46% of Scope 3. Regenerative agriculture program covering 500K hectares. Scope 1 reduction accelerated with biomass boiler conversions.', 1),
        ('ArcelorMittal', 2025, 78650.3, 12340.8, 34560.2, 125551.3, 25.0, 2018, 'Steel Manufacturing', 'ISO 14064', 'calculated', 'DRI-EAF route showing 62% reduction vs BF-BOF. Hydrogen injection trials at Ghent facility promising. Carbon capture pilot operational at 100kt/year capacity.', 1),
        ('Amazon.com Inc', 2025, 8976.3, 5432.1, 67890.4, 82298.8, 100.0, 2019, 'E-Commerce & Cloud', 'GHG Protocol', 'verified', 'Custom EV delivery fleet reducing last-mile emissions 36%. AWS renewable energy procurement at 90%. Packaging optimization saving 1.2M tonnes CO2e annually.', 1),
        ('Heidelberg Materials', 2025, 45230.7, 3210.5, 12340.8, 60782.0, 25.0, 2019, 'Cement & Building Materials', 'GHG Protocol', 'reported', 'Clinker ratio reduction to 68% from 74% baseline. Alternative fuels at 32% thermal substitution rate. CCUS project at Brevik capturing 400kt CO2 annually.', 1),
        ('Maersk', 2025, 12340.6, 567.8, 4320.1, 17228.5, 100.0, 2018, 'Shipping & Logistics', 'ISO 14064', 'verified', 'Methanol-powered vessels now 12% of fleet. EEOI improved 41% from baseline. Green corridor partnerships reducing port emissions.', 1),
        ('BHP Group', 2025, 8765.4, 6543.2, 287650.3, 302958.9, 30.0, 2020, 'Mining', 'GHG Protocol', 'calculated', 'Scope 3 dominated by steel customer emissions. Operational emissions reduced through fleet electrification. Nickel West achieving carbon neutral status for battery-grade nickel.', 1),
        ('Danone SA', 2025, 987.6, 543.2, 18765.4, 20296.2, 50.0, 2015, 'Food & Beverage', 'CDP', 'verified', 'Regenerative agriculture practices on 28% of milk sourcing. Scope 1 methane from dairy operations addressed through feed additives. Packaging emissions reduced 19%.', 1),
        ('Lufthansa Group', 2025, 23456.7, 876.5, 5432.1, 29765.3, 50.0, 2019, 'Aviation', 'ISO 14064', 'reported', 'SAF usage at 5.2% of total fuel consumption. Fleet renewal reducing fuel burn per passenger-km 18%. Offsetting programs transitioning to carbon removal credits.', 1),
        ('BASF SE', 2025, 15670.3, 4320.8, 56780.4, 76771.5, 25.0, 2018, 'Chemicals', 'GHG Protocol', 'verified', 'Verbund integration reducing overall emissions intensity. Chemcycling program diverting 120kt plastic waste. Steam cracker electrification pilot at Ludwigshafen showing 90% reduction.', 1),
        ('Enel SpA', 2025, 34560.2, 1230.4, 8765.3, 44555.9, 80.0, 2017, 'Utilities', 'CDP', 'verified', 'Coal phase-out 85% complete. Renewable capacity at 62GW globally. Grid emissions factor improved 47% from baseline year.', 1);
    `);

    // 4. sustainability_metrics
    await client.query(`
      INSERT INTO sustainability_metrics (metric_name, category, current_value, target_value, unit, trend, measurement_period, data_source, confidence_level, status, ai_analysis, user_id) VALUES
        ('Carbon Emissions Intensity', 'environmental', 42.3, 25.0, 'tCO2e/M$ revenue', 'improving', 'FY 2025', 'GHG Protocol Reporting', 95.2, 'active', 'Emissions intensity decreased 8.3% YoY. Absolute emissions also declining indicating genuine decoupling from revenue growth.', 1),
        ('Renewable Energy Share', 'environmental', 67.8, 100.0, '%', 'improving', 'FY 2025', 'Energy Management System', 98.5, 'active', 'PPA agreements signed for additional 450MW. On-site solar generation increased 23%. Grid greening in key markets contributing to improvements.', 1),
        ('Water Withdrawal Intensity', 'environmental', 3.24, 2.00, 'm3/unit produced', 'improving', 'FY 2025', 'Water Metering Systems', 92.1, 'active', 'Closed-loop cooling systems installed at 4 facilities. Water recycling rate improved to 45%. Drought-risk sites prioritized for reduction measures.', 1),
        ('Waste Diversion Rate', 'environmental', 82.5, 95.0, '%', 'improving', 'FY 2025', 'Waste Management Reports', 88.7, 'active', 'Zero-waste-to-landfill achieved at 7 of 12 manufacturing sites. Composting program for organic waste launched. Hazardous waste reduced 14%.', 1),
        ('Gender Pay Gap', 'social', 4.2, 0.0, '%', 'improving', 'FY 2025', 'HR Analytics Platform', 96.8, 'active', 'Pay equity analysis conducted across all 28 markets. Remediation adjustments applied for 342 employees. Median gap reduced from 6.1% to 4.2%.', 1),
        ('Employee Engagement Score', 'social', 78.4, 85.0, '%', 'stable', 'Q4 2025', 'Gallup Survey', 94.3, 'active', 'Engagement stable despite organizational restructuring. Manager effectiveness scores improved. Remote work satisfaction remains high at 82%.', 1),
        ('Lost Time Injury Rate', 'social', 0.34, 0.20, 'per 200K hours', 'improving', 'FY 2025', 'EHS Reporting System', 97.9, 'active', 'LTIR decreased 22% from prior year. Near-miss reporting increased 45% indicating improved safety culture. Contractor safety improved significantly.', 1),
        ('Board Gender Diversity', 'governance', 41.7, 50.0, '%', 'improving', 'FY 2025', 'Corporate Governance Report', 100.0, 'active', 'Female board representation increased with 2 new appointments. Skills matrix shows improved diversity across all competency areas.', 1),
        ('Supply Chain Audit Coverage', 'social', 72.3, 90.0, '%', 'improving', 'FY 2025', 'Supplier Management Platform', 89.4, 'active', 'Tier 1 supplier audits at 95%. Tier 2 coverage at 48%, up from 31%. Critical non-conformances reduced 28% YoY.', 1),
        ('Scope 3 Reporting Completeness', 'environmental', 78.5, 95.0, '%', 'improving', 'FY 2025', 'Carbon Accounting System', 82.6, 'active', 'Categories 1, 2, 3, 4, 5, 6, 7, 11, 12 now quantified. Use-of-sold-products methodology refined. Investment emissions calculation initiated.', 1),
        ('Community Investment', 'social', 12.8, 15.0, 'M USD', 'improving', 'FY 2025', 'CSR Department', 95.7, 'active', 'Strategic community investments up 18%. STEM education programs expanded to 14 countries. Disaster relief contributions totaled $2.1M.', 1),
        ('Anti-Corruption Training', 'governance', 94.2, 100.0, '%', 'stable', 'FY 2025', 'LMS Platform', 99.1, 'active', 'Annual anti-corruption training completed by 94.2% of employees. New hires reach 100% within 30 days. Board members complete enhanced program.', 1),
        ('Biodiversity Net Gain', 'environmental', 108.3, 110.0, '% net gain', 'improving', 'FY 2025', 'Ecological Surveys', 76.4, 'active', 'Biodiversity metric units generated exceeding minimum 10% requirement. Habitat banking credits covering 340 hectares. Species monitoring shows population recovery.', 1),
        ('Data Privacy Incidents', 'governance', 3.0, 0.0, 'incidents', 'improving', 'FY 2025', 'InfoSec Team', 98.2, 'active', 'Privacy incidents decreased from 7 to 3 YoY. All incidents classified as low severity. Enhanced DPIA process preventing issues at design stage.', 1),
        ('Volunteer Hours', 'social', 45230.0, 60000.0, 'hours', 'improving', 'FY 2025', 'HR Volunteer Platform', 93.5, 'active', 'Employee volunteer participation rate at 34%. Skills-based volunteering increased 52%. Partnership with 120+ nonprofits globally.', 1);
    `);

    // 5. regulatory_compliance
    await client.query(`
      INSERT INTO regulatory_compliance (regulation_name, jurisdiction, compliance_status, due_date, last_audit_date, risk_level, responsible_party, description, penalty_amount, status, ai_analysis, user_id) VALUES
        ('EU Corporate Sustainability Reporting Directive (CSRD)', 'European Union', 'compliant', '2026-01-01', '2025-09-15', 'high', 'Chief Sustainability Officer', 'Mandatory double materiality assessment and sustainability reporting under European Sustainability Reporting Standards (ESRS).', 5000000.00, 'active', 'Full compliance achieved for first reporting period. Double materiality assessment completed with 847 stakeholder inputs. ESRS datapoints mapped to existing data systems.', 1),
        ('EU Taxonomy Regulation', 'European Union', 'partial', '2025-12-31', '2025-08-20', 'high', 'Head of ESG Finance', 'Classification of economic activities as environmentally sustainable based on six environmental objectives and DNSH criteria.', 2000000.00, 'active', 'Taxonomy alignment at 34% of revenue. DNSH assessment completed for climate objectives. Biodiversity and circular economy criteria require additional data collection.', 1),
        ('SEC Climate Disclosure Rule', 'United States', 'compliant', '2026-03-31', '2025-11-10', 'high', 'General Counsel', 'Mandatory climate-related financial disclosures including Scope 1, 2 emissions, climate risk management, and governance oversight.', 10000000.00, 'active', 'Readiness assessment complete. GHG emissions data pipeline established with reasonable assurance controls. Climate governance disclosures drafted.', 1),
        ('Sustainable Finance Disclosure Regulation (SFDR)', 'European Union', 'compliant', '2025-06-30', '2025-05-15', 'medium', 'Head of Compliance', 'Entity and product-level sustainability disclosures for financial market participants under Articles 6, 8, and 9.', 3000000.00, 'active', 'Article 8 fund classifications reviewed and confirmed. Principal adverse impact indicators reported for all mandatory items. Website disclosures updated.', 1),
        ('UK Modern Slavery Act', 'United Kingdom', 'compliant', '2025-09-30', '2025-07-22', 'medium', 'Head of Procurement', 'Annual modern slavery statement detailing steps taken to prevent forced labor and human trafficking in supply chains.', 0.00, 'active', 'Statement published covering 100% of Tier 1 suppliers. Enhanced due diligence for high-risk geographies. Worker voice mechanisms expanded to cover 89% of supply base.', 1),
        ('California SB 253 Climate Corporate Data Accountability Act', 'United States - California', 'pending', '2026-06-30', '2025-10-01', 'high', 'VP Sustainability', 'Mandatory disclosure of Scope 1, 2, and 3 GHG emissions by entities with over $1B revenue doing business in California.', 500000.00, 'active', 'Scope 3 reporting methodology being finalized. Category 15 investments emissions calculation in progress. Third-party assurance provider selected.', 1),
        ('German Supply Chain Due Diligence Act (LkSG)', 'Germany', 'compliant', '2025-12-31', '2025-06-30', 'high', 'Chief Procurement Officer', 'Mandatory human rights and environmental due diligence across direct suppliers and indirect suppliers with substantiated knowledge.', 8000000.00, 'active', 'Risk analysis updated for 2,400 direct suppliers. Complaint mechanism established and publicized. Remediation plans in place for 12 identified cases.', 1),
        ('Task Force on Nature-related Financial Disclosures (TNFD)', 'Global', 'partial', '2026-06-30', '2025-04-18', 'medium', 'Head of Environmental Affairs', 'Voluntary framework for nature-related risk and opportunity disclosure using LEAP approach.', 0.00, 'monitoring', 'LEAP assessment initiated for priority operations. Dependencies on ecosystem services mapped for 60% of operational sites. Data gaps identified for biodiversity metrics.', 1),
        ('EU Carbon Border Adjustment Mechanism (CBAM)', 'European Union', 'compliant', '2026-01-01', '2025-10-30', 'high', 'Head of Trade Compliance', 'Carbon pricing mechanism for imported goods including cement, iron, steel, aluminum, fertilizers, electricity, and hydrogen.', 4000000.00, 'active', 'Transitional reporting obligations met. Embedded emissions calculations verified for all CBAM goods. Authorized declarant registration completed.', 1),
        ('Australian Climate-Related Financial Disclosures', 'Australia', 'pending', '2026-07-01', '2025-08-12', 'medium', 'APAC Compliance Manager', 'Mandatory climate disclosures for large entities aligned with ISSB standards, phased implementation starting with Group 1 entities.', 1500000.00, 'active', 'Gap analysis against AASB Sustainability Standards completed. Scenario analysis capabilities being developed. Board climate competency training scheduled.', 1),
        ('EU Deforestation Regulation (EUDR)', 'European Union', 'partial', '2025-12-30', '2025-09-05', 'high', 'Head of Sustainable Sourcing', 'Due diligence requirements for commodities linked to deforestation including palm oil, soy, wood, cocoa, coffee, cattle, and rubber.', 4000000.00, 'active', 'Geolocation data collected for 87% of relevant supply chains. Due diligence statements being prepared. Smallholder supplier support programs launched.', 1),
        ('Singapore Green Taxonomy', 'Singapore', 'compliant', '2025-12-31', '2025-07-15', 'low', 'ASEAN Sustainability Lead', 'Classification system for green and transition activities in financial sector, covering energy, transport, and real estate sectors.', 500000.00, 'active', 'Green taxonomy alignment assessed for APAC portfolio. Transition activities identified and documented. Traffic light system applied to all relevant exposures.', 1),
        ('Japan Sustainability Standards Board (SSBJ) Standards', 'Japan', 'pending', '2027-03-31', '2025-05-20', 'medium', 'Japan Country Manager', 'Japanese sustainability disclosure standards aligned with ISSB for prime market listed companies.', 0.00, 'monitoring', 'Early adoption assessment underway. Existing TCFD disclosures provide strong foundation. Japanese language reporting capabilities being established.', 1),
        ('Corporate Sustainability Due Diligence Directive (CS3D)', 'European Union', 'pending', '2027-07-01', '2025-03-10', 'high', 'Chief Legal Officer', 'Mandatory human rights and environmental due diligence across value chains with civil liability provisions.', 25000000.00, 'active', 'Transposition monitoring in key EU member states. Value chain mapping extended to Tier 3. Climate transition plan being developed to meet Article 15 requirements.', 1),
        ('Brazil Sustainability Reporting Requirements (CVM Resolution 193)', 'Brazil', 'partial', '2026-12-31', '2025-06-28', 'medium', 'LATAM Compliance Director', 'Mandatory sustainability reporting for publicly traded companies aligned with ISSB standards, with phased implementation.', 2000000.00, 'monitoring', 'ISSB-aligned reporting framework under development. Existing GRI reports provide data foundation. Local assurance provider engagement initiated.', 1);
    `);

    // 6. supply_chain_esg
    await client.query(`
      INSERT INTO supply_chain_esg (supplier_name, country, industry, esg_score, environmental_rating, social_rating, governance_rating, risk_level, audit_date, certification, status, ai_analysis, user_id) VALUES
        ('Taiwan Semiconductor Manufacturing Co', 'Taiwan', 'Semiconductors', 82.4, 'A', 'B+', 'A', 'low', '2025-06-15', 'ISO 14001, ISO 45001', 'approved', 'Strong environmental management system. Water recycling rate at 87%. RBA Code of Conduct compliance verified. Carbon reduction roadmap aligned with science-based targets.', 1),
        ('Foxconn Technology Group', 'China', 'Electronics Manufacturing', 61.8, 'B', 'C', 'B', 'medium', '2025-03-22', 'ISO 14001', 'under_review', 'Environmental compliance adequate. Labor practice concerns persist despite improvements. Overtime hours reduced 18% but still above RBA limits at some facilities.', 1),
        ('BASF SE', 'Germany', 'Chemicals', 85.7, 'A', 'A', 'A', 'low', '2025-07-10', 'ISO 14001, ISCC Plus, EcoVadis Gold', 'approved', 'Industry-leading Verbund efficiency concept. Comprehensive product stewardship. Circular economy initiatives showing measurable impact.', 1),
        ('Cargill Inc', 'United States', 'Agriculture & Food', 58.3, 'C', 'B', 'B', 'high', '2025-04-18', 'RSPO, Rainforest Alliance', 'flagged', 'Deforestation links in soy supply chain flagged by satellite monitoring. Palm oil sourcing meets RSPO standards. Smallholder program needs expansion.', 1),
        ('Glencore PLC', 'Switzerland', 'Mining & Metals', 52.1, 'C', 'C', 'D', 'high', '2025-02-28', 'ICMM Membership', 'flagged', 'Multiple environmental violations at DRC operations. Human rights concerns in artisanal mining proximity. Governance improvements needed following bribery settlements.', 1),
        ('Sumitomo Chemical Co', 'Japan', 'Chemicals', 79.6, 'A', 'B+', 'A', 'low', '2025-08-05', 'ISO 14001, Responsible Care', 'approved', 'Strong chemical safety management. Scope 1+2 reduction of 28% from 2017 baseline. Good labor practices with low incident rates across facilities.', 1),
        ('PT Indofood Sukses Makmur', 'Indonesia', 'Food Processing', 48.9, 'D', 'C', 'C', 'high', '2025-01-20', 'RSPO (suspended)', 'flagged', 'RSPO certification suspended pending remediation of labor rights findings. Deforestation risk in palm oil operations. Child labor allegations under investigation.', 1),
        ('Siemens Gamesa', 'Spain', 'Renewable Energy Equipment', 88.2, 'A+', 'A', 'A', 'low', '2025-09-12', 'ISO 14001, ISO 45001, SA8000', 'approved', 'Excellent lifecycle assessment practices. Blade recycling program leading the industry. Supply chain transparency rated among the best in renewable sector.', 1),
        ('Samsung SDI', 'South Korea', 'Battery Manufacturing', 74.3, 'B+', 'B', 'B+', 'medium', '2025-05-30', 'ISO 14001, IATF 16949', 'approved', 'Battery recycling capability established. Cobalt sourcing due diligence improved with blockchain traceability. Energy intensity per GWh capacity decreasing.', 1),
        ('Tata Steel', 'India', 'Steel Manufacturing', 68.7, 'B', 'B+', 'B', 'medium', '2025-07-25', 'ISO 14001, ResponsibleSteel', 'approved', 'Kalinganagar plant achieving best-in-class water recycling. Community development programs well-established. Transition to hydrogen-based steelmaking underway.', 1),
        ('Wilmar International', 'Singapore', 'Palm Oil & Agribusiness', 55.4, 'C', 'C', 'B', 'high', '2025-03-15', 'RSPO, ISCC', 'under_review', 'No Deforestation policy in place but monitoring gaps exist. Traceability to plantation level at 83%. Smallholder inclusion program covering 200K farmers.', 1),
        ('LG Chem', 'South Korea', 'Chemicals & Batteries', 76.8, 'B+', 'B+', 'A', 'low', '2025-06-20', 'ISO 14001, EcoVadis Silver', 'approved', 'Battery materials sourcing transparency improving. Renewable energy commitment for all manufacturing sites by 2030. Water stewardship at Yeosu complex is exemplary.', 1),
        ('Vedanta Resources', 'India', 'Mining & Metals', 43.2, 'D', 'D', 'C', 'high', '2025-04-02', 'None current', 'blacklisted', 'Persistent environmental violations at Tuticorin copper smelter. Community displacement issues unresolved. Governance structure lacks independent oversight.', 1),
        ('Schneider Electric', 'France', 'Electrical Equipment', 91.3, 'A+', 'A', 'A+', 'low', '2025-08-18', 'ISO 14001, ISO 50001, EcoVadis Platinum', 'approved', 'Industry leader in sustainability performance. Zero Carbon Project covering 1000+ top suppliers. Circular economy revenue at 17% of total. Exemplary governance practices.', 1),
        ('Grupo Bimbo', 'Mexico', 'Food & Bakery', 72.5, 'B+', 'B+', 'B', 'medium', '2025-05-10', 'ISO 14001, Rainforest Alliance', 'approved', 'Largest fleet of electric delivery vehicles in LATAM. Carbon neutral certified for key facilities. Wheat sourcing program promoting regenerative agriculture.', 1);
    `);

    // 7. risk_assessments
    await client.query(`
      INSERT INTO risk_assessments (risk_name, category, likelihood, impact_level, risk_score, mitigation_strategy, owner, review_date, status, ai_analysis, user_id) VALUES
        ('Stranded Asset Risk from Fossil Fuel Exposure', 'climate', 'high', 'critical', 92.5, 'Accelerate portfolio transition to renewable assets. Implement internal carbon pricing at $85/tonne. Divest from thermal coal by 2028.', 'Chief Investment Officer', '2025-12-15', 'monitoring', 'Portfolio analysis shows $3.2B exposure to stranded asset risk under 1.5C scenario. Transition pathway modeling indicates 60% of at-risk assets can be repositioned by 2030.', 1),
        ('CSRD Non-Compliance Penalties', 'regulatory', 'medium', 'high', 78.3, 'Dedicated CSRD implementation team established. Double materiality assessment completed. ESRS datapoint mapping 92% complete. External assurance engagement in progress.', 'Chief Sustainability Officer', '2025-10-30', 'mitigated', 'Compliance readiness at 88%. Key gap areas: biodiversity metrics and value chain Scope 3 data. Third-party assurance provider engaged for limited assurance.', 1),
        ('Physical Climate Risk to Coastal Facilities', 'climate', 'high', 'high', 85.7, 'Conduct facility-level physical risk assessments. Implement flood defense measures at priority sites. Develop relocation contingency plans for high-risk locations.', 'VP Operations', '2025-09-20', 'identified', 'Seven facilities identified in high-risk flood zones under RCP 8.5 scenario. Annual expected loss estimated at $45M by 2040. Insurance coverage gaps identified for three locations.', 1),
        ('Supply Chain Human Rights Violation', 'reputational', 'medium', 'critical', 88.1, 'Enhanced supplier due diligence program. Third-party audits for all Tier 1 high-risk suppliers. Worker grievance mechanism with anonymous reporting. Real-time media monitoring.', 'Chief Procurement Officer', '2025-11-05', 'monitoring', 'Risk heightened by CS3D implementation. 23 suppliers in high-risk categories. Independent audits identified 4 critical findings requiring immediate remediation.', 1),
        ('Carbon Tax Escalation Impact', 'financial', 'very_high', 'high', 81.4, 'Internal carbon pricing at $100/tonne to stress-test business decisions. Accelerate Scope 1 reduction program. Hedge exposure through carbon credit pre-purchases.', 'Chief Financial Officer', '2025-08-15', 'monitoring', 'EU ETS prices projected to reach EUR 120 by 2028. CBAM increasing costs for imported materials by 8-15%. Internal abatement cost curve identifies $2.1B in cost-effective reduction measures.', 1),
        ('Biodiversity Regulation Non-Compliance', 'regulatory', 'medium', 'high', 72.6, 'TNFD-aligned assessment of nature dependencies. Biodiversity action plans for all operational sites. No-net-loss commitment with measurable KPIs.', 'Head of Environmental Affairs', '2026-01-20', 'identified', 'Emerging regulations in EU and Australia increasing compliance requirements. Nature-positive commitments need quantifiable baselines. Ecosystem services valuation not yet complete.', 1),
        ('Greenwashing Litigation Risk', 'reputational', 'high', 'high', 84.2, 'Substantiate all environmental marketing claims with third-party verification. Legal review of all ESG communications. Implement internal green claims policy.', 'General Counsel', '2025-07-30', 'monitoring', 'Increasing trend of greenwashing lawsuits globally. Net-zero claims particularly scrutinized. Three marketing campaigns flagged for review by legal team.', 1),
        ('Water Scarcity Operational Disruption', 'operational', 'high', 'high', 79.8, 'Water risk assessment using WRI Aqueduct at all sites. Closed-loop water systems at water-stressed facilities. Alternative water sourcing strategies including desalination.', 'VP Manufacturing', '2025-10-10', 'monitoring', 'Four manufacturing facilities in extremely high water-stress regions. Business continuity plans require updating. Water recycling investment of $12M approved for priority sites.', 1),
        ('ESG Rating Downgrade', 'reputational', 'medium', 'medium', 62.3, 'Proactive engagement with key ESG rating agencies. Gap analysis against MSCI, Sustainalytics, and ISS methodologies. Dedicated investor relations ESG function.', 'Head of Investor Relations', '2025-09-01', 'mitigated', 'Current ratings: MSCI AA, Sustainalytics Low Risk. Key improvement areas identified in data privacy and product governance. Peer benchmarking shows competitive positioning.', 1),
        ('Transition Risk in Automotive Supply Chain', 'climate', 'very_high', 'critical', 94.1, 'ICE phase-out planning for Tier 1 suppliers. EV component sourcing diversification. Battery supply chain resilience program.', 'Head of Strategic Procurement', '2025-12-01', 'identified', 'EU 2035 ICE ban affecting 340 suppliers in portfolio. Supplier readiness assessment shows 45% have credible transition plans. $200M supplier transition support fund proposed.', 1),
        ('Cybersecurity Breach of ESG Data', 'operational', 'medium', 'high', 71.5, 'SOC 2 Type II certification for ESG data platforms. Data encryption at rest and in transit. Regular penetration testing. Incident response plan specific to ESG data.', 'Chief Information Security Officer', '2025-08-25', 'mitigated', 'ESG data increasingly material for financial reporting. Regulatory requirements for data assurance increasing. Current security posture adequate but continuous monitoring essential.', 1),
        ('Workforce Transition Displacement', 'operational', 'high', 'medium', 68.9, 'Just transition framework with retraining programs. Internal mobility platform. Community economic diversification support for affected regions.', 'Chief Human Resources Officer', '2025-11-15', 'monitoring', '2,300 roles identified as at-risk from energy transition. Reskilling programs launched for 800 employees. Early retirement packages designed for workers over 55.', 1),
        ('Extreme Weather Event Supply Disruption', 'climate', 'very_high', 'high', 89.3, 'Multi-sourcing strategy for critical components. Safety stock levels increased for climate-vulnerable supply routes. Parametric insurance for key logistics corridors.', 'Chief Supply Chain Officer', '2025-07-15', 'monitoring', 'Three supply disruptions in past 12 months attributed to extreme weather. Average recovery time of 23 days. Financial impact of $67M in FY2025.', 1),
        ('Anti-Corruption Compliance Failure', 'regulatory', 'low', 'critical', 65.8, 'Annual anti-corruption training mandatory for all employees. Enhanced due diligence for government-facing contracts. Whistleblower protection and anonymous reporting hotline.', 'Chief Compliance Officer', '2025-10-20', 'mitigated', 'Compliance program rated as effective by external review. Zero violations in past 24 months. Enhanced monitoring in 8 high-risk jurisdictions.', 1),
        ('Scope 3 Data Quality Insufficiency', 'financial', 'high', 'medium', 73.4, 'Supplier engagement program for primary data collection. Industry average data for non-material categories. Annual methodology review and improvement plan.', 'Head of Carbon Accounting', '2025-09-30', 'identified', 'Currently 62% of Scope 3 based on primary data, remainder using spend-based estimates. Regulatory expectations moving toward verified data. Assurance readiness for Scope 3 at limited level only.', 1);
    `);

    // 8. greenwashing_checks
    await client.query(`
      INSERT INTO greenwashing_checks (company_name, claim_text, claim_source, verification_status, confidence_score, evidence_found, category, severity, status, ai_analysis, user_id) VALUES
        ('EcoFresh Industries', 'Our products are 100% carbon neutral across the entire supply chain', 'Company Website - Homepage Banner', 'greenwashing', 91.2, 'No third-party verification found. Scope 3 emissions not measured. Carbon neutral claim based only on Scope 1 offsets using non-additional credits.', 'emissions', 'high', 'flagged', 'Classic overclaim pattern. Carbon neutral claim cannot be substantiated without comprehensive Scope 3 measurement. Offset quality questionable based on registry analysis.', 1),
        ('GreenTech Solutions', 'Powered by 100% renewable energy since 2023', 'Annual Sustainability Report p.12', 'verified', 87.5, 'RE100 membership confirmed. PPA agreements covering 100% of electricity consumption verified. Residual Scope 2 market-based emissions at zero.', 'energy', 'low', 'cleared', 'Claim is substantiated by RE100 membership and audited PPA portfolio. Market-based accounting methodology properly applied and disclosed.', 1),
        ('Pacific Textiles Ltd', 'Zero waste to landfill across all manufacturing operations', 'Marketing Brochure Q3 2025', 'misleading', 78.4, 'Three of seven facilities verified as zero waste. Remaining four facilities divert 72-88% of waste. Definition of zero waste not aligned with industry standard (<1% to landfill).', 'waste', 'medium', 'flagged', 'Claim is partially true but misleadingly applied to all operations. Recommend qualified language specifying which facilities have achieved certification.', 1),
        ('AquaPure Corp', 'We have reduced water consumption by 50% since 2020', 'Press Release - March 2025', 'verified', 92.8, 'Water meter data audited by third party confirms 48.7% reduction in absolute water withdrawal. Intensity metric also improved by 52%. Baseline properly documented.', 'water', 'low', 'cleared', 'Claim is substantiated within reasonable bounds. Absolute and intensity reductions both significant. Methodology and baseline year clearly documented.', 1),
        ('Global Mining Co', 'Committed to net-zero emissions by 2040', 'CEO Statement - Annual Report', 'unverified', 54.3, 'Net-zero target announced but no interim targets set. No SBTi commitment. Pathway methodology not disclosed. Current emissions trajectory shows 2% annual increase.', 'emissions', 'high', 'reviewed', 'Aspiration without credible plan. No interim milestones or capital allocation disclosed. Current trajectory incompatible with stated ambition. ISO Net Zero Guidelines not followed.', 1),
        ('BioPlast Packaging', 'Our packaging is 100% biodegradable and ocean-safe', 'Product Label', 'greenwashing', 94.6, 'PLA-based material only biodegrades in industrial composting conditions (58C+). Does not biodegrade in marine environments. No marine biodegradability certification.', 'waste', 'high', 'flagged', 'Misleading consumer communication. Biodegradable claim requires qualification of conditions. Ocean-safe claim is unsubstantiated and potentially harmful if it encourages littering.', 1),
        ('SolarMax Energy', 'Our solar panels have the lowest carbon footprint in the industry', 'Advertising Campaign', 'misleading', 72.1, 'LCA shows competitive but not lowest carbon footprint. Two competitors have lower lifecycle emissions per kWh. Claim based on outdated 2021 comparison data.', 'emissions', 'medium', 'flagged', 'Comparative environmental claims require current, comprehensive evidence. Recommend updating LCA and using qualified language or specific metrics.', 1),
        ('FastFashion Group', 'Sustainable collection made with recycled ocean plastics', 'Product Line Marketing', 'misleading', 81.3, 'Collection contains 12% recycled polyester from coastal cleanup programs, not ocean plastics directly. Remaining 88% is virgin polyester. Sustainable collection is 3% of total production.', 'waste', 'high', 'flagged', 'Ocean plastic claim is technically inaccurate - material is coastal plastic. Percentage of recycled content not disclosed on marketing. Disproportionate marketing spend vs actual impact.', 1),
        ('GreenBuild Construction', 'All our developments achieve net-zero operational carbon', 'Investor Presentation Slide 8', 'verified', 88.9, 'UKGBC Net Zero Carbon Buildings Framework applied. Operational energy modeled and verified. Residual emissions offset with gold-standard credits. Embodied carbon not claimed as net zero.', 'emissions', 'low', 'cleared', 'Claim is properly scoped to operational carbon only. Methodology aligned with recognized framework. Offset quality verified. Transparency on embodied carbon scope is commendable.', 1),
        ('PetroGreen Ltd', 'Investing $5B in clean energy transition by 2030', 'CEO Speech at Climate Summit', 'unverified', 48.7, 'Capital allocation plans show $1.2B committed to date. Definition of clean energy includes natural gas with CCS. No independent verification of investment classification methodology.', 'energy', 'high', 'reviewed', 'Investment figure includes categories that many frameworks would not classify as clean energy. Natural gas CCS projects account for 40% of the claimed figure. Methodology not aligned with EU Taxonomy.', 1),
        ('OrganicFarms Inc', 'Pesticide-free farming across 100% of our operations', 'Product Packaging', 'verified', 95.1, 'USDA Organic and EU Organic certifications active for all production sites. Annual third-party inspections confirm compliance. No synthetic pesticide residues detected in testing.', 'emissions', 'low', 'cleared', 'Claim substantiated by dual organic certification. Regular testing and inspection regime in place. Transparent supply chain documentation available.', 1),
        ('CleanAir Shipping', 'Our LNG-powered fleet reduces emissions by 25%', 'Corporate Sustainability Page', 'misleading', 69.8, 'Tank-to-wake CO2 reduction verified at 23%. However, well-to-wake analysis including methane slip shows only 9% GHG reduction. Methane slip from dual-fuel engines not disclosed.', 'emissions', 'medium', 'flagged', 'Claim is technically accurate for CO2 only but omits methane slip which significantly reduces the climate benefit. Well-to-wake analysis should be the basis for climate claims.', 1),
        ('EcoBank Financial', 'Largest green bond issuance in the banking sector - $2B', 'Press Release', 'verified', 86.4, 'Green bond verified by Sustainalytics as second-party opinion. Use of proceeds tracking shows 97% allocation to eligible green projects. Impact reporting publicly available.', 'emissions', 'low', 'cleared', 'Green bond framework meets ICMA Green Bond Principles. Allocation and impact reporting meet market standards. Claim of largest issuance verified against Bloomberg data.', 1),
        ('ChemCorp International', 'Our new formula reduces environmental impact by 40%', 'Product Launch Campaign', 'unverified', 55.6, 'Internal LCA conducted but not peer-reviewed or third-party verified. Environmental impact definition not specified. Comparison baseline unclear - could be vs previous formula or vs competitors.', 'emissions', 'medium', 'reviewed', 'Vague environmental claim without clear definition of impact category. LCA methodology not disclosed. Recommend ISO 14025 Type III environmental declaration for substantiation.', 1),
        ('TrueGreen Apparel', 'Carbon-neutral clothing line verified by third party', 'Hang Tag and Website', 'verified', 90.3, 'ClimatePartner certification verified. Full product lifecycle assessment conducted. Remaining emissions offset with VCS and Gold Standard credits. Transparent ID tracking available.', 'emissions', 'low', 'cleared', 'Claim is well-substantiated with recognized certification. Product-level footprint calculation follows PAS 2050. Offset portfolio includes both avoidance and removal credits.', 1);
    `);

    // 9. stakeholder_reports
    await client.query(`
      INSERT INTO stakeholder_reports (report_title, stakeholder_group, report_type, fiscal_year, key_highlights, material_topics, engagement_score, status, ai_analysis, user_id) VALUES
        ('Annual ESG Performance Report for Investors', 'investors', 'annual', 2025, 'ESG rating upgraded to AA. Total shareholder return outperformed ESG index by 3.2%. Green revenue share increased to 34%. Climate transition plan approved by board.', 'Climate strategy, Capital allocation, ESG integration, Risk management, Executive remuneration alignment', 87.5, 'published', 'Investor engagement on ESG increased 42% YoY. Say-on-climate resolution received 89% approval. ESG-linked KPIs in executive compensation well-received.', 1),
        ('Employee Sustainability Engagement Report Q4 2025', 'employees', 'quarterly', 2025, 'Green Champions network grew to 1,200 members. Employee carbon footprint challenge saved 450 tCO2e. Sustainability training completion at 91%. Green commuting program launched.', 'Workplace sustainability, Employee engagement, Skills development, Well-being, Diversity and inclusion', 78.4, 'published', 'Employee engagement with sustainability initiatives trending upward. Green Champions program driving bottom-up innovation. Sustainability literacy score improved from 62 to 74.', 1),
        ('Community Impact Annual Report 2025', 'community', 'annual', 2025, 'Community investment totaled $14.2M. STEM education programs reached 45,000 students. Local employment rate at operational sites maintained above 85%. Zero community grievances unresolved.', 'Community investment, Local employment, Education, Environmental remediation, Indigenous rights', 82.1, 'published', 'Social license to operate metrics strong across all operational regions. Community satisfaction survey shows 79% positive sentiment. Grievance mechanism response time improved to 14 days average.', 1),
        ('Regulatory Compliance Briefing H2 2025', 'regulators', 'quarterly', 2025, 'CSRD compliance achieved ahead of deadline. SEC climate disclosure readiness confirmed. Zero regulatory enforcement actions in period. Proactive engagement with 8 regulatory consultations.', 'Regulatory compliance, Climate disclosure, Tax transparency, Anti-corruption, Data protection', 91.3, 'approved', 'Proactive regulatory engagement strategy yielding positive relationships. Early adoption of emerging standards demonstrates leadership. Zero enforcement actions for third consecutive year.', 1),
        ('Customer Sustainability Transparency Report 2025', 'customers', 'annual', 2025, 'Product carbon footprint labels on 78% of SKUs. Sustainable product range grew 23%. Customer sustainability satisfaction score at 4.2/5. Scope 3 Category 11 reduction of 12%.', 'Product sustainability, Circular economy, Sustainable packaging, Supply chain transparency, Green innovation', 76.8, 'published', 'Customer demand for sustainability information increasing. B2B customers increasingly requiring ESG data in procurement. Product-level carbon footprints driving purchasing decisions.', 1),
        ('Q1 2025 Investor ESG Update', 'investors', 'quarterly', 2025, 'SBTi near-term targets validated. Green bond proceeds fully allocated. CDP score improved to A-. Scope 1+2 reduction of 8% in quarter. ESG-linked revolving credit facility renewed.', 'Emissions reduction, Green finance, Climate targets, Portfolio alignment, Transition planning', 84.2, 'published', 'Quarterly cadence of ESG updates appreciated by buy-side analysts. SBTi validation a significant milestone. Green bond allocation reporting meets ICMA standards.', 1),
        ('Annual Workforce Diversity and Inclusion Report', 'employees', 'annual', 2025, 'Gender diversity in leadership reached 38%. Ethnicity pay gap reduced to 2.8%. Disability inclusion index score at 87. Neurodiversity hiring program launched. 14 Employee Resource Groups active.', 'Diversity equity inclusion, Pay equity, Accessibility, Cultural competency, Talent development', 81.6, 'published', 'D&I metrics showing consistent improvement. Intersectional analysis introduced for first time. Board diversity exceeding local governance code requirements in all jurisdictions.', 1),
        ('Crisis Communication Report - Supply Chain Incident', 'community', 'ad_hoc', 2025, 'Chemical spill at Tier 2 supplier contained within 4 hours. Community notification within 2 hours. Independent environmental assessment commissioned. Remediation plan implemented.', 'Crisis management, Community safety, Environmental remediation, Supply chain accountability, Transparency', 65.3, 'approved', 'Crisis response protocol activated effectively. Community engagement during incident rated as transparent. Long-term monitoring commitment well-received. Lessons learned integrated into supplier management.', 1),
        ('Q2 2025 ESG Performance Dashboard for Board', 'investors', 'quarterly', 2025, 'All 12 ESG KPIs on track or ahead. Water intensity reduced 6%. Renewable energy procurement at 72%. Zero fatalities for 18 consecutive months. Board ESG training completed.', 'Performance tracking, KPI monitoring, Board oversight, Strategy alignment, Risk management', 89.7, 'approved', 'Board-level ESG dashboard providing effective oversight. Traffic light system enables quick identification of areas requiring attention. Quarterly deep-dives on material topics well-structured.', 1),
        ('Annual Sustainability Report for Regulators - EU Operations', 'regulators', 'annual', 2025, 'Full ESRS compliance in first reporting year. Double materiality assessment covered 12 topics. EU Taxonomy alignment at 34% of CapEx. CBAM reporting obligations met for all applicable imports.', 'CSRD compliance, EU Taxonomy, CBAM, SFDR, Due diligence', 93.8, 'published', 'Regulatory reporting quality rated as exemplary by external auditors. Early engagement with national transposition of CS3D demonstrates proactive approach.', 1),
        ('Customer Sustainability Webinar Series Summary', 'customers', 'quarterly', 2025, 'Four webinars delivered reaching 2,300 B2B customers. Product carbon calculator tool launched. Sustainable procurement guide distributed. Customer ESG questionnaire response rate at 94%.', 'Customer education, Product transparency, Sustainable procurement, Collaboration, Innovation', 73.5, 'published', 'Customer engagement through educational content proving effective for B2B relationships. Product carbon calculator driving competitive advantage in tender processes.', 1),
        ('Community Grievance Mechanism Annual Report', 'community', 'annual', 2025, 'Total grievances received: 47. Resolved within SLA: 42. Average resolution time: 18 days. Zero escalations to judicial mechanisms. Community satisfaction with resolution process: 76%.', 'Grievance mechanism, Community relations, Remediation, Human rights, Access to remedy', 76.2, 'approved', 'Grievance mechanism meeting UNGPs Effectiveness Criteria. Resolution rate improved from 82% to 89%. Categories: environmental (38%), social (45%), economic (17%).', 1),
        ('Annual Report to Pension Fund Trustees', 'investors', 'annual', 2025, 'Fund ESG integration score at 8.2/10. Climate VaR reduced by $120M through portfolio rebalancing. Stewardship activities covered 340 holdings. Voting on ESG resolutions increased 28%.', 'Fiduciary duty, Climate risk, Stewardship, Voting policy, Beneficiary outcomes', 86.9, 'published', 'Pension fund trustees increasingly focused on systemic ESG risks. Climate scenario analysis informing strategic asset allocation. Beneficiary engagement on ESG preferences initiated.', 1),
        ('Employee Health Safety and Wellbeing Quarterly Report', 'employees', 'quarterly', 2025, 'TRIR at 0.42. Mental health support utilization up 34%. Ergonomic assessments completed for all office relocations. Heat stress protocols activated at 3 sites. Zero occupational diseases reported.', 'Occupational health, Mental health, Safety culture, Wellbeing, Work-life balance', 80.1, 'approved', 'Leading indicators showing positive trends. Near-miss reporting culture established. Mental health first aider network expanded to all major sites. Return-to-work program success rate at 94%.', 1),
        ('Q3 2025 Regulatory Engagement Summary', 'regulators', 'quarterly', 2025, 'Participated in 5 public consultations including ISSB Scope 3 methodology. Hosted regulatory roundtable on nature-related disclosures. Submitted response to SEC climate rule amendments.', 'Regulatory engagement, Policy advocacy, Standard setting, Industry collaboration, Best practice sharing', 88.4, 'approved', 'Active participation in standard-setting processes positioning company as thought leader. Regulatory relationships strong across key jurisdictions. No adversarial interactions reported.', 1);
    `);

    // 10. data_validations
    await client.query(`
      INSERT INTO data_validations (dataset_name, data_source, validation_type, records_checked, errors_found, error_rate, severity, issues_description, status, ai_analysis, user_id) VALUES
        ('Scope 1 GHG Emissions - Global Facilities', 'SAP EHS Module', 'accuracy', 12450, 23, 0.18, 'low', 'Minor unit conversion errors in 14 records from APAC region. 9 records with missing emission factors for refrigerant gases.', 'validated', 'Data quality exceeds ISAE 3410 thresholds. Unit conversion errors traced to manual data entry at 3 facilities. Automated conversion recommended. Refrigerant emission factors updated from latest IPCC AR6.', 1),
        ('Scope 2 Electricity Consumption', 'Utility Invoice Processing System', 'completeness', 8760, 156, 1.78, 'medium', 'Missing electricity data for 156 monthly readings across 13 facilities. Primarily small office locations. Gap-filling methodology applied using estimated consumption.', 'needs_review', 'Completeness below 99% target for Scope 2 reporting. Missing data concentrated in leased office spaces where utility data access is limited. Recommend smart meter installation for remaining gaps.', 1),
        ('Employee Diversity Demographics', 'Workday HR Platform', 'consistency', 45230, 89, 0.20, 'low', 'Inconsistent ethnicity categorization between US and international datasets. Gender identity field has 89 records with legacy binary values needing update.', 'validated', 'Data consistency good overall. Ethnicity categorization differences due to regional legal requirements. Gender identity field migration 99.8% complete. EEOC reporting unaffected.', 1),
        ('Supply Chain Audit Results', 'Supplier Management Platform', 'accuracy', 2340, 45, 1.92, 'medium', 'Audit scores for 45 suppliers show discrepancies between auditor assessment and platform records. Root cause: manual transcription errors during data migration.', 'needs_review', 'Accuracy issues traced to Q2 platform migration. Recommend re-verification of all migrated audit records. Future audits have automated data flow eliminating transcription risk.', 1),
        ('Water Consumption Metering Data', 'IoT Sensor Network', 'timeliness', 52560, 1240, 2.36, 'medium', 'Sensor data delays exceeding 24 hours for 1,240 hourly readings. Three facilities experienced sensor outages totaling 18 days of missing data.', 'failed', 'Real-time monitoring reliability at 97.6% against 99.5% target. Sensor maintenance schedule needs revision. Backup manual reading protocol not consistently followed during outages.', 1),
        ('Carbon Offset Registry Verification', 'Verra VCS Registry', 'accuracy', 890, 3, 0.34, 'low', 'Three offset credits showed retirement date discrepancies between internal records and registry. All credits confirmed as valid and retired upon reconciliation.', 'validated', 'Offset portfolio integrity confirmed. Discrepancies attributed to timezone differences in API data sync. Registry reconciliation process automated for future reporting periods.', 1),
        ('Board Governance Meeting Minutes', 'Corporate Secretary Office', 'completeness', 48, 2, 4.17, 'high', 'Two board committee meeting minutes missing ESG agenda item documentation. Attendance records incomplete for one extraordinary meeting.', 'needs_review', 'Governance documentation gaps may affect CSRD compliance. Corporate secretary to implement standardized ESG minutes template. Digital recording and transcription recommended as backup.', 1),
        ('Waste Stream Classification Data', 'Waste Management Contractors', 'consistency', 15670, 234, 1.49, 'medium', 'Waste classification codes inconsistent across 5 waste management contractors. 234 records use deprecated EU Waste Catalogue codes.', 'needs_review', 'Harmonization of waste codes across contractors needed. Recommend adopting standardized waste taxonomy in all contractor agreements. Data quality improvement plan submitted.', 1),
        ('Employee Training Completion Records', 'Learning Management System', 'completeness', 28450, 1420, 4.99, 'high', 'Training completion records for 1,420 employees not synchronized from regional LMS instances. Primarily affecting contractors and temporary workers.', 'failed', 'Significant completeness gap affects compliance training reporting. Root cause: contractor LMS integration not configured for 3 regional instances. Fix estimated at 2 weeks.', 1),
        ('Energy Certificate and REC Tracking', 'REC Registry Platform', 'accuracy', 4560, 12, 0.26, 'low', 'Twelve Renewable Energy Certificate records show mismatch between generation period and reporting period allocation. All certificates valid and tracked.', 'validated', 'Minor allocation timing issues do not affect RE100 compliance. Recommend automated matching algorithm for generation-to-consumption period alignment.', 1),
        ('Community Investment Financial Data', 'SAP Financial Module', 'accuracy', 3450, 67, 1.94, 'medium', 'Sixty-seven community investment transactions miscategorized between charitable donations and commercial sponsorships. Affects LBG reporting methodology.', 'needs_review', 'Miscategorization impacts London Benchmarking Group reporting metrics. Finance team to implement enhanced coding structure aligned with LBG categories.', 1),
        ('Biodiversity Survey Field Data', 'Ecological Consultancy Reports', 'consistency', 890, 34, 3.82, 'high', 'Survey methodology inconsistencies between three ecological consultancies. Species identification confidence levels not standardized. 34 records flagged for expert review.', 'needs_review', 'Biodiversity data quality is a known industry challenge. Recommend standardizing survey protocols across all consultancies. Reference taxonomy alignment needed for consistent species reporting.', 1),
        ('Scope 3 Category 1 Purchased Goods Emissions', 'Spend-Based Calculation Tool', 'accuracy', 34560, 2340, 6.77, 'high', 'Emission factors applied to 2,340 procurement categories using outdated EEIO data (2019 vintage). Commodity price fluctuations affecting spend-based estimates.', 'failed', 'Scope 3 Category 1 data quality is the weakest area. Transition from spend-based to supplier-specific data needed for top 200 suppliers. Updated EEIO factors from EXIOBASE v3.8 recommended.', 1),
        ('Safety Incident Investigation Reports', 'EHS Incident Management System', 'timeliness', 234, 18, 7.69, 'high', 'Eighteen incident investigations exceeded the 30-day completion target. Root cause analysis depth rated as insufficient for 7 investigations.', 'needs_review', 'Investigation timeliness is below regulatory expectations. Resource constraints in APAC EHS team identified as primary cause. Additional investigator training and staffing recommended.', 1),
        ('Customer Product Carbon Footprint Labels', 'LCA Database', 'accuracy', 5670, 45, 0.79, 'medium', 'Product carbon footprint calculations for 45 SKUs using outdated background LCA data. Three product categories missing end-of-life emission factors.', 'needs_review', 'Product-level footprint accuracy is critical for consumer-facing claims. Recommend annual LCA data refresh cycle. End-of-life modeling needs market-specific disposal data.', 1);
    `);

    // 11. climate_scenarios
    await client.query(`
      INSERT INTO climate_scenarios (scenario_name, temperature_pathway, time_horizon, physical_risk_level, transition_risk_level, financial_impact_millions, sector, assumptions, status, ai_analysis, user_id) VALUES
        ('Net Zero 2050 - Orderly Transition', '1.5C', '2050', 'low', 'high', -245.8, 'Multi-sector Portfolio', 'IEA NZE 2050 aligned. Carbon price reaches $250/tonne by 2050. Rapid phase-out of unabated fossil fuels. Universal electrification of transport by 2045.', 'approved', 'Orderly transition shows manageable financial impact due to early positioning. Renewable energy assets appreciate significantly. Stranded asset risk concentrated in 15% of portfolio.', 1),
        ('Delayed Transition - Disorderly', '2C', '2050', 'medium', 'very_high', -890.3, 'Multi-sector Portfolio', 'Policy action delayed until 2030 then rapid. Carbon price shock to $300/tonne. Technology readiness levels insufficient for some hard-to-abate sectors. Higher asset stranding risk.', 'approved', 'Disorderly transition creates significant value destruction in 2030-2040 period. Carbon price shock impacts propagate through supply chains. Adaptation costs 40% higher than orderly scenario.', 1),
        ('Hot House World', '4C', '2050', 'critical', 'low', -2340.5, 'Multi-sector Portfolio', 'No additional policy action. Physical risks dominate. Sea level rise of 0.6m by 2050. Extreme weather frequency doubles. Agricultural yield decline of 20-30% in tropical regions.', 'reviewed', 'Catastrophic physical risk impacts dominate. Coastal facility losses estimated at $450M. Supply chain disruptions become chronic. Insurance costs increase 3x in high-risk regions.', 1),
        ('Paris-Aligned Energy Transition', '1.5C', '2030', 'low', 'high', -120.4, 'Energy & Utilities', 'Coal phase-out by 2030 in OECD. Renewable energy capacity triples. Gas as transition fuel through 2035. Nuclear capacity expansion in Asia.', 'approved', 'Near-term transition costs are front-loaded but manageable. Gas asset valuation sensitive to transition fuel narrative. Renewable energy CAPEX requirements of $180M over period.', 1),
        ('Agricultural Climate Resilience', '2C', '2040', 'high', 'medium', -345.6, 'Agriculture & Food', 'Changing precipitation patterns affect 60% of sourcing regions. Heat stress reduces livestock productivity 15%. Water availability declines in Mediterranean and South Asia.', 'modeled', 'Crop yield variability increases significantly. Diversification of sourcing origins needed. Investment in climate-resilient cultivars offers 3:1 return. Water pricing expected to increase 40%.', 1),
        ('Coastal Infrastructure Risk', '3C', '2050', 'critical', 'low', -567.8, 'Real Estate & Infrastructure', 'Sea level rise 0.4m by 2050. Storm surge frequency increases 2.5x. Flood zone expansion affects 12% of portfolio. Insurance retreat from high-risk coastal areas.', 'reviewed', 'Portfolio exposure to coastal risk is concentrated in 8 assets worth $2.1B. Insurance availability declining for 3 highest-risk properties. Managed retreat planning needed for 2 facilities.', 1),
        ('Clean Transport Revolution', '1.5C', '2030', 'low', 'high', 156.7, 'Automotive & Transport', 'EV market share reaches 60% of new sales by 2030. ICE bans in major markets from 2030-2035. Charging infrastructure scales 10x. Battery costs decline 40%.', 'approved', 'Positive financial impact from early EV transition positioning. Revenue growth from EV components offsets ICE decline. Battery supply chain investment creates competitive moat.', 1),
        ('Financial Sector Climate Stress Test', '2C', '2050', 'medium', 'high', -678.9, 'Financial Services', 'Bank of England and ECB stress test parameters. Credit risk increases in carbon-intensive sectors. Mortgage portfolio exposure to flood risk. Green asset demand premium.', 'modeled', 'Credit losses concentrated in oil & gas (8% default rate increase) and heavy industry (5%). Mortgage portfolio physical risk is manageable with current LTV ratios. Green bond premium at 35bps.', 1),
        ('Mining Sector Water Scarcity', '3C', '2040', 'high', 'medium', -234.5, 'Mining & Resources', 'Water stress increases at 65% of mining operations. Processing water costs triple. Community water conflicts intensify. Desalination becomes necessary at 4 sites.', 'modeled', 'Water security is the primary climate risk for mining operations. $120M investment in water recycling and desalination required. Community water sharing agreements need renegotiation.', 1),
        ('Biodiversity-Driven Regulatory Change', '2C', '2030', 'medium', 'high', -189.3, 'Consumer Goods', 'EU Deforestation Regulation fully enforced. Nature-positive targets mandated. Biodiversity credit markets established. Ecosystem services valuation incorporated into accounting.', 'draft', 'Nature-related regulatory risk is emerging rapidly. Supply chain deforestation exposure is primary concern. Biodiversity credit costs estimated at $45M annually if offsets required.', 1),
        ('Tech Sector Energy Demand Surge', '2C', '2040', 'low', 'medium', -123.4, 'Technology', 'AI data center energy demand grows 300%. Grid capacity constraints in key markets. Renewable PPA competition intensifies. Nuclear SMRs become viable for data center power.', 'modeled', 'Energy demand growth from AI is material risk to renewable energy commitments. Grid connection timelines extending. On-site generation and storage becoming strategic priorities.', 1),
        ('Healthcare Climate Adaptation', '3C', '2050', 'high', 'low', -345.7, 'Healthcare & Pharmaceuticals', 'Heat-related illness increases 40%. Vector-borne disease range expansion. Cold chain vulnerability during extreme weather. Active pharmaceutical ingredient supply disruption.', 'draft', 'Revenue opportunity from climate-related health products. Cold chain infrastructure investment needed. API sourcing diversification critical for India-dependent supply chains.', 1),
        ('Shipping Decarbonization Pathway', '1.5C', '2050', 'low', 'high', -456.2, 'Maritime & Logistics', 'IMO 2050 net-zero target. Green fuel availability scales from 2030. Carbon intensity indicator enforcement. Green corridor network expands to 50 routes.', 'approved', 'Fleet renewal to green fuel vessels requires $800M CAPEX. Green fuel price premium of 2-3x conventional fuels. Carbon levy funding mechanism expected by 2028.', 1),
        ('Circular Economy Transition', '2C', '2040', 'low', 'medium', 234.1, 'Manufacturing', 'Extended Producer Responsibility regulations expand globally. Right-to-repair legislation enacted. Virgin material taxation introduced. Secondary material markets mature.', 'modeled', 'Circular economy transition presents net positive financial outcome. Revenue from take-back programs at $120M by 2035. Material cost savings of $90M from recycled content. Design-for-circularity CAPEX of $45M.', 1),
        ('Just Transition - Workforce Impact', '1.5C', '2040', 'low', 'high', -178.9, 'Multi-sector Portfolio', 'Workforce transition costs for 15,000 affected roles. Reskilling programs for green jobs. Community economic diversification in fossil-dependent regions. Social protection measures.', 'reviewed', 'Workforce transition costs are material but manageable with early planning. Reskilling investment of $45M yields positive ROI by 2035. Community investment program prevents social license erosion.', 1);
    `);

    // 12. biodiversity_impacts
    await client.query(`
      INSERT INTO biodiversity_impacts (project_name, location, ecosystem_type, species_affected, habitat_area_hectares, impact_type, mitigation_measures, biodiversity_score, monitoring_frequency, status, ai_analysis, user_id) VALUES
        ('Amazon Reforestation Initiative', 'Para State, Brazil', 'forest', 342, 12500.0, 'positive', 'Native species planting using 80+ species. Wildlife corridors connecting fragmented habitat. Community-managed forest reserves. Seed bank preservation for genetic diversity.', 78.4, 'quarterly', 'monitoring', 'Canopy closure reaching 65% in 5-year plots. Bird species count increased 34% from baseline. Jaguar camera trap sightings resumed after 8-year absence. Carbon sequestration at 12 tCO2/ha/year.', 1),
        ('North Sea Offshore Wind Farm Ecology Program', 'Dogger Bank, United Kingdom', 'marine', 127, 8450.0, 'neutral', 'Artificial reef foundations on monopiles. Fish aggregation devices installed. Seasonal construction restrictions for bird migration. Marine mammal exclusion zones during piling.', 65.2, 'biannual', 'monitoring', 'Reef effect creating habitat for 45 marine species. Seabird collision rates below predicted levels. Fishing exclusion zone acting as de facto marine reserve. Benthic community recovery within 2 years of installation.', 1),
        ('Palm Oil Plantation Biodiversity Assessment', 'Kalimantan, Indonesia', 'forest', 89, 3400.0, 'negative', 'High Conservation Value area designation. Riparian buffer zones of 50m maintained. Orangutan translocation program. Zero-deforestation commitment since 2020.', 32.1, 'monthly', 'degraded', 'Historical deforestation has significantly reduced biodiversity. HCV areas maintain 40% of original species diversity. Orangutan population stable but genetically isolated. Peatland restoration needed on 800 hectares.', 1),
        ('Great Barrier Reef Coral Restoration', 'Queensland, Australia', 'marine', 234, 560.0, 'positive', 'Coral gardening and outplanting of heat-resistant genotypes. Crown-of-thorns starfish control. Water quality improvement through catchment management. Assisted gene flow program.', 71.8, 'monthly', 'restored', 'Coral cover increased 18% in restoration zones. Heat-resistant coral genotypes showing 3x survival rate during bleaching events. Fish biomass up 45% in restored areas.', 1),
        ('Wetland Compensation Banking - Highway Project', 'Louisiana, United States', 'wetland', 156, 890.0, 'positive', 'Mitigation banking credits generated for highway construction impacts. Hydrological restoration of drained wetlands. Native plant revegetation. Invasive species removal program.', 62.5, 'quarterly', 'restored', 'Wetland functional assessment shows 72% of target condition achieved. Migratory waterfowl usage increased 56%. Water filtration services valued at $2.3M annually. Carbon sequestration at 8 tCO2/ha/year.', 1),
        ('Alpine Grassland Mining Rehabilitation', 'Atacama Region, Chile', 'grassland', 45, 2100.0, 'negative', 'Progressive rehabilitation during mining operations. Topsoil banking and biological soil crust preservation. Native bunchgrass revegetation. Vicuna habitat corridor maintenance.', 41.3, 'biannual', 'monitoring', 'High-altitude ecosystem recovery is extremely slow. Topsoil reapplication showing 30% native plant establishment. Vicuna populations stable in adjacent corridors. Water table monitoring shows no additional drawdown.', 1),
        ('Urban Biodiversity Enhancement - Corporate Campus', 'Munich, Germany', 'urban', 78, 12.5, 'positive', 'Green roof installation with native wildflower meadows. Insect hotels and bee colonies. Bird nesting boxes for 15 species. Bioswales and rain gardens for stormwater management.', 58.7, 'quarterly', 'stable', 'Urban biodiversity index increased 42% from baseline. Pollinator species count at 67 including 4 red-list species. Green roof reducing building cooling demand by 15%. Stormwater retention of 70% during typical rainfall events.', 1),
        ('Mangrove Restoration for Blue Carbon', 'Sundarbans, Bangladesh', 'wetland', 198, 4500.0, 'positive', 'Community-led mangrove planting. Sustainable aquaculture in restored areas. Erosion control through mangrove buffer zones. Climate adaptation co-benefits for coastal communities.', 82.1, 'monthly', 'restored', 'Mangrove survival rate at 78%. Blue carbon sequestration at 6.5 tCO2/ha/year. Fishery productivity in restored areas up 120%. Storm surge protection estimated at $8M/year in avoided damages.', 1),
        ('Savanna Grassland Conservation - Solar Farm', 'Western Cape, South Africa', 'grassland', 112, 650.0, 'neutral', 'Agrivoltaic design allowing grazing beneath panels. Endemic plant rescue and translocation. Controlled grazing management plan. Alien invasive plant removal across 200 hectares.', 55.4, 'quarterly', 'monitoring', 'Agrivoltaic approach preserving 80% of grassland functionality. Grazing beneath panels maintaining plant diversity. Panels providing thermal refuge for small mammals. Alien species coverage reduced from 35% to 8%.', 1),
        ('Boreal Forest Conservation Offset', 'Ontario, Canada', 'forest', 267, 18000.0, 'positive', 'Conservation easement preventing logging. Indigenous-led land management. Caribou habitat corridor protection. Peatland hydrological integrity maintenance.', 88.6, 'biannual', 'monitoring', 'Intact boreal forest landscape maintaining full species complement. Woodland caribou population increased 12% over 5 years. Carbon stocks of 180 tC/ha maintained. Indigenous land stewardship recognized internationally.', 1),
        ('Seagrass Meadow Restoration', 'Chesapeake Bay, United States', 'marine', 145, 320.0, 'positive', 'Seagrass seed broadcasting over 320 hectares. Water quality improvement through nutrient reduction. Propeller scar recovery program. Citizen science monitoring network.', 69.3, 'monthly', 'restored', 'Seagrass coverage increased 230% from 2020 baseline. Blue crab populations recovered in restored areas. Water clarity improved allowing natural seagrass expansion. Carbon sequestration and nutrient cycling services valued at $4.2M/year.', 1),
        ('Mining Tailings Revegetation Project', 'Pilbara, Australia', 'grassland', 34, 780.0, 'negative', 'Engineered growth media application. Direct seeding of 45 native spinifex and shrub species. Topsoil seed bank utilization. Fauna recolonization monitoring.', 28.9, 'quarterly', 'degraded', 'Arid environment making revegetation challenging. Plant survival rate at 35% requiring supplemental watering. Fauna return limited to generalist species. Soil microbial community development below expectations.', 1),
        ('Tropical Wetland Buffer Zone Protection', 'Mekong Delta, Vietnam', 'wetland', 189, 2800.0, 'positive', 'Buffer zone establishment around shrimp farms. Mangrove-shrimp integrated farming systems. Bird sanctuary designation for migratory species. Community-based natural resource management.', 73.6, 'monthly', 'monitoring', 'Integrated farming systems reducing habitat pressure. Migratory bird counts increased 67% with sanctuary designation. Water quality in buffer zones significantly improved. Community income diversification reducing exploitation pressure.', 1),
        ('Mountain Ecosystem Ski Resort Impact', 'Valais, Switzerland', 'grassland', 56, 340.0, 'negative', 'Slope rehabilitation during off-season. Alpine meadow seed mix application. Ibex and chamois crossing structures. Artificial snowmaking water recycling to reduce stream abstraction.', 47.2, 'biannual', 'monitoring', 'Alpine meadow recovery slow on groomed slopes. Crossing structures used by 89% of target ungulate populations. Snowmaking water recycling reduced stream abstraction by 45%. Climate change reducing natural snow cover threatening ecosystem baseline.', 1),
        ('Coral Triangle Marine Protected Area', 'Raja Ampat, Indonesia', 'marine', 567, 15000.0, 'positive', 'Community-managed marine protected area. Sustainable tourism revenue sharing. No-take zones covering 30% of area. Coral reef monitoring with AI image analysis.', 91.2, 'monthly', 'monitoring', 'Highest marine biodiversity on Earth being preserved. Reef fish biomass 5x higher inside no-take zones. Manta ray population stable at 1,500 individuals. Community revenue from tourism exceeding extractive alternatives by 3:1.', 1);
    `);

    // 13. water_usage
    await client.query(`
      INSERT INTO water_usage (facility_name, location, water_source, consumption_cubic_meters, discharge_cubic_meters, recycled_pct, water_stress_level, quality_index, reduction_target_pct, status, ai_analysis, user_id) VALUES
        ('Frankfurt Manufacturing Plant', 'Frankfurt, Germany', 'municipal', 245000.0, 198000.0, 42.5, 'low', 92.3, 20.0, 'within_target', 'Consumption reduced 12% YoY through cooling tower optimization. Discharge quality exceeds permit requirements. Rainwater harvesting system capturing 15% of process water needs.', 1),
        ('Chennai Semiconductor Facility', 'Chennai, India', 'groundwater', 890000.0, 623000.0, 67.8, 'high', 88.7, 35.0, 'exceeding', 'Water stress area requiring aggressive reduction. UF/RO recycling system operating at 67.8% recovery. Groundwater levels declining despite community water replenishment program. Desalination feasibility study underway.', 1),
        ('Phoenix Data Center', 'Phoenix, Arizona, USA', 'municipal', 156000.0, 12000.0, 28.3, 'high', 95.1, 30.0, 'exceeding', 'Adiabatic cooling consuming significant water in desert climate. Transition to closed-loop cooling planned for 2027. Air-side economizer hours being maximized to reduce water dependency.', 1),
        ('Rotterdam Refinery', 'Rotterdam, Netherlands', 'surface', 4560000.0, 4120000.0, 55.2, 'low', 85.4, 15.0, 'within_target', 'Once-through cooling dominates water use. Closed-loop conversion 45% complete. Discharge thermal pollution within BREF limits. Process water recycling achieving 55% in non-cooling applications.', 1),
        ('Sao Paulo Beverage Plant', 'Sao Paulo, Brazil', 'municipal', 1230000.0, 890000.0, 38.9, 'medium', 90.2, 25.0, 'within_target', 'Water-use ratio at 2.1 L/L of product, below industry benchmark of 2.5. CIP system optimization saving 180K m3 annually. Community water access program providing clean water to 12,000 residents.', 1),
        ('Melbourne Chemical Processing', 'Melbourne, Australia', 'recycled', 567000.0, 234000.0, 78.4, 'medium', 87.6, 30.0, 'within_target', 'Pioneering use of Class A recycled water for process applications. Zero potable water use for non-product-contact applications. Membrane bioreactor achieving 99.9% pathogen removal.', 1),
        ('Monterrey Automotive Plant', 'Monterrey, Mexico', 'municipal', 345000.0, 278000.0, 52.1, 'high', 91.8, 40.0, 'exceeding', 'Severe water stress region requiring community water sharing agreements. Paint shop water recycling at 85%. Landscaping converted to xeriscaping saving 45K m3 annually. Rainwater capture insufficient due to low precipitation.', 1),
        ('Singapore Pharmaceutical Plant', 'Jurong, Singapore', 'municipal', 234000.0, 189000.0, 71.2, 'low', 96.4, 20.0, 'within_target', 'NEWater (reclaimed water) used for 60% of non-critical processes. Ultrapure water system efficiency at 82%. PUB water efficiency benchmarking award recipient. Zero liquid discharge target 90% achieved.', 1),
        ('Cape Town Food Processing', 'Cape Town, South Africa', 'municipal', 178000.0, 134000.0, 62.3, 'high', 89.5, 50.0, 'within_target', 'Day Zero experience in 2018 drove permanent water culture change. Water consumption reduced 48% from 2017 baseline. Atmospheric water generation pilot providing 5% of needs. Greywater recycling for landscape and sanitation.', 1),
        ('Jeddah Desalination-Dependent Facility', 'Jeddah, Saudi Arabia', 'municipal', 456000.0, 312000.0, 83.6, 'high', 93.2, 25.0, 'within_target', 'Desalinated water supply at 100% of intake. Internal recycling rate at industry-leading 83.6%. Solar-powered desalination pilot reducing energy intensity of water supply. Zero liquid discharge achieved for process waste streams.', 1),
        ('Dublin Data Center Campus', 'Dublin, Ireland', 'municipal', 89000.0, 67000.0, 15.4, 'low', 97.8, 10.0, 'within_target', 'Low water stress region but efficiency improvements ongoing. Free cooling utilized 72% of operating hours reducing water demand. Rainwater harvesting meets landscape irrigation needs. Water PUE metric at 0.5 L/kWh.', 1),
        ('Bangalore IT Campus', 'Bangalore, India', 'groundwater', 234000.0, 178000.0, 58.9, 'high', 86.3, 40.0, 'exceeding', 'Groundwater depletion is critical concern. Sewage treatment plant providing 58.9% of water needs through recycling. Borewell recharge program replenishing 120K m3 annually. Water-neutral campus target by 2028.', 1),
        ('Lima Mining Processing', 'Arequipa, Peru', 'surface', 2340000.0, 1890000.0, 45.6, 'high', 82.1, 30.0, 'exceeding', 'Processing water consumption high due to ore characteristics. Tailings thickening reducing fresh water demand by 340K m3. Community water monitoring committee established. Acid mine drainage prevention system operational.', 1),
        ('Oslo Office Headquarters', 'Oslo, Norway', 'municipal', 12000.0, 10800.0, 8.2, 'low', 98.5, 10.0, 'within_target', 'Low water consumption office building. Dual-flush systems and aerating faucets standard. Green roof retention reducing stormwater discharge by 40%. Rainwater used for toilet flushing.', 1),
        ('Dhaka Textile Mill', 'Dhaka, Bangladesh', 'groundwater', 1890000.0, 1456000.0, 34.7, 'high', 78.9, 45.0, 'critical', 'Textile dyeing operations are water-intensive. Effluent treatment plant upgrading to zero liquid discharge. Groundwater arsenic contamination risk requires continuous monitoring. Industry alliance for shared effluent treatment under development.', 1);
    `);

    // 14. energy_audits
    await client.query(`
      INSERT INTO energy_audits (facility_name, audit_date, total_consumption_kwh, renewable_pct, efficiency_rating, carbon_intensity, cost_per_kwh, annual_cost, savings_potential_pct, recommendations, status, ai_analysis, user_id) VALUES
        ('Frankfurt Manufacturing Plant', '2025-03-15', 18500000, 72.4, 'B', 0.234, 0.18, 3330000, 18.5, 'Install VFD on 12 main HVAC motors. Upgrade compressed air system to reduce leakage from 28% to 10%. LED retrofit remaining 30% of facility. Waste heat recovery from furnaces for space heating.', 'completed', 'Energy intensity improved 8% YoY. Compressed air leakage is largest efficiency opportunity. Waste heat recovery ROI of 2.3 years. VFD installation payback period of 14 months.', 1),
        ('Chennai Semiconductor Facility', '2025-06-22', 45600000, 34.8, 'C', 0.567, 0.09, 4104000, 24.3, 'PPA for 30MW solar farm to increase renewable share. Cleanroom airflow optimization using CFD modeling. UPS system upgrade to high-efficiency models. Chiller plant optimization with AI controls.', 'action_required', 'High energy intensity driven by cleanroom operations. Solar PPA would reduce carbon intensity by 35%. Cleanroom airflow optimization typically yields 15-20% HVAC savings in semiconductor fabs.', 1),
        ('Phoenix Data Center', '2025-01-28', 67800000, 85.2, 'A', 0.089, 0.06, 4068000, 8.2, 'Deploy liquid cooling for next GPU cluster expansion. Raise cold aisle temperature set point from 20C to 24C. Install thermal energy storage for load shifting. Optimize UPS loading to efficiency sweet spot.', 'completed', 'PUE at 1.18 is excellent. Liquid cooling for AI workloads critical for next phase. Temperature set point increase is zero-cost measure. Battery storage can provide $450K in demand charge savings.', 1),
        ('Rotterdam Refinery', '2025-04-10', 234000000, 12.5, 'D', 0.789, 0.11, 25740000, 22.7, 'Electrify low-temperature process heating. Install CHP system for steam and power co-generation. Heat integration study for crude distillation unit. Steam trap survey and repair program.', 'action_required', 'Refinery energy efficiency below industry quartile benchmarks. CHP system would improve overall energy efficiency to 85%. Steam system losses estimated at $3.8M annually. Electrification feasibility depends on grid capacity.', 1),
        ('Singapore Pharmaceutical Plant', '2025-08-05', 12300000, 56.7, 'B', 0.312, 0.22, 2706000, 15.8, 'HVAC optimization in API manufacturing areas. Install solar PV on available roof area (2.4MW potential). Chilled water system delta-T improvement. Building envelope thermal performance upgrade.', 'completed', 'Pharmaceutical manufacturing HVAC is primary energy consumer at 62%. Solar PV potential would increase renewable to 75%. Chilled water optimization estimated savings of $380K/year.', 1),
        ('Sao Paulo Beverage Plant', '2025-05-18', 28900000, 45.3, 'B', 0.345, 0.12, 3468000, 19.4, 'Biogas from wastewater treatment for boiler fuel. High-efficiency ammonia chillers to replace HFC systems. Heat pump for pasteurizer waste heat recovery. Biomass boiler for remaining thermal demand.', 'completed', 'Biogas potential of 3.2MW from existing wastewater treatment. Refrigeration system replacement eliminates 1,200 tCO2e from refrigerant leakage. Heat pump ROI at 2.8 years.', 1),
        ('Melbourne Chemical Processing', '2025-07-12', 56700000, 28.9, 'C', 0.623, 0.14, 7938000, 21.2, 'Electric boiler for process steam (grid is 60% renewable). Waste heat recovery from exothermic reactions. Compressed air system upgrade and leak remediation. Smart building controls for non-process areas.', 'action_required', 'Chemical processing energy intensity is high but benchmarks well against peers. Electric boiler transition feasible given Victorias renewable grid trajectory. Waste heat recovery potential of 12MW thermal.', 1),
        ('Dublin Data Center Campus', '2025-09-30', 42100000, 92.1, 'A', 0.045, 0.15, 6315000, 6.8, 'Free cooling hours optimization using predictive weather modeling. White space airflow management improvements. Server refresh to latest generation (30% better performance per watt). On-site battery storage for grid services revenue.', 'completed', 'Industry-leading efficiency with PUE of 1.14. Limited further efficiency gains available. Server refresh provides best ROI. Grid services revenue potential of $280K annually from battery storage.', 1),
        ('Monterrey Automotive Plant', '2025-02-20', 34500000, 18.7, 'C', 0.534, 0.10, 3450000, 26.8, 'Bilateral PPA for 25MW wind farm. Paint booth cure oven infrared conversion. Robotic welding power factor correction. Compressed air pressure optimization from 7.5 to 6.5 bar.', 'action_required', 'Automotive plant energy profile dominated by paint operations (42%) and body shop (28%). Wind PPA would bring renewable share to 72%. Paint oven conversion delivers 35% energy savings in curing process.', 1),
        ('Cape Town Food Processing', '2025-11-08', 15600000, 62.8, 'B', 0.278, 0.16, 2496000, 14.6, 'Rooftop solar expansion (additional 3MW). Refrigeration heat recovery for hot water production. Evaporative condenser upgrade for refrigeration plant. LED cold storage lighting with occupancy sensors.', 'completed', 'Solar PV performing above projections due to excellent Cape Town irradiance. Refrigeration heat recovery potential of $180K annual savings. Cold storage lighting upgrade is quick-win with 8-month payback.', 1),
        ('Jeddah Desalination-Dependent Facility', '2025-04-25', 23400000, 41.2, 'C', 0.489, 0.08, 1872000, 28.4, 'Solar PV installation on factory roof and carparks (8MW total). Thermal energy storage using molten salt for process heat. Desalination energy recovery devices. HVAC system replacement with inverter-driven units.', 'action_required', 'Exceptional solar resource underutilized. 8MW PV potential would exceed facility demand enabling grid export. Desalination energy recovery could reduce water-related energy by 40%. HVAC replacement overdue.', 1),
        ('Bangalore IT Campus', '2025-06-15', 8900000, 48.5, 'B', 0.356, 0.11, 979000, 17.3, 'Expand rooftop solar from 2MW to 5MW. Server room hot-aisle containment. UPS consolidation from multiple units to centralized. Electric vehicle charging infrastructure with smart load management.', 'completed', 'IT campus energy per employee benchmarks well. Solar expansion ROI excellent given Karnataka solar tariffs. Server room improvements yield 22% cooling energy reduction. EV charging represents growing demand requiring planning.', 1),
        ('Lima Mining Processing', '2025-08-20', 189000000, 8.4, 'D', 0.823, 0.07, 13230000, 19.8, 'SAG mill power draw optimization using advanced process control. Conveyor system to replace haul truck diesel consumption. Trolley assist for remaining haul trucks on ramps. Solar-diesel hybrid power plant for remote site.', 'action_required', 'Mining operations energy intensity dominated by comminution (45%) and haulage (30%). Advanced mill control typically yields 3-5% improvement. Conveyor system CAPEX of $85M with 6-year payback.', 1),
        ('Oslo Office Headquarters', '2025-10-12', 980000, 98.2, 'A', 0.012, 0.20, 196000, 5.2, 'Building automation system upgrade for predictive control. Electric snow melting system optimization. EV charging load management. Occupancy-based ventilation control enhancement.', 'completed', 'Near-zero carbon energy from Norwegian hydro grid. Building efficiency already excellent. Marginal gains from BMS optimization. Focus shifting to embodied carbon of any renovation works.', 1),
        ('Dhaka Textile Mill', '2025-03-08', 34500000, 5.2, 'F', 0.912, 0.09, 3105000, 35.4, 'Replace coal-fired boiler with biomass/gas. Install rooftop solar (4MW potential). Dyeing process hot water heat recovery. Motor replacement program for pre-IE2 motors. Steam distribution insulation and trap maintenance.', 'action_required', 'Textile mill energy profile is worst in portfolio. Coal boiler replacement is priority for both efficiency and emissions. Heat recovery from dyeing effluent could provide 40% of hot water needs. Motor replacement program addresses 200+ inefficient units.', 1);
    `);

    // 15. social_impacts
    await client.query(`
      INSERT INTO social_impacts (program_name, category, beneficiaries_count, investment_amount, impact_score, measurement_method, location, start_date, end_date, status, ai_analysis, user_id) VALUES
        ('Women in STEM Leadership Academy', 'diversity', 2450, 3200000.00, 87.3, 'Pre-post assessment with control group', 'Global - 28 countries', '2023-01-15', '2025-12-31', 'active', 'Program graduates showing 42% higher promotion rates than control group. Retention rate of participants at 94%. Pipeline of women in technical leadership roles increased 28%.', 1),
        ('Zero Harm Workplace Safety Transformation', 'health_safety', 45000, 8500000.00, 91.2, 'Lagging and leading indicator tracking (OSHA framework)', 'All manufacturing facilities globally', '2022-06-01', '2026-06-30', 'active', 'TRIR reduced from 1.2 to 0.34 since program inception. Safety culture survey scores improved from 62 to 84. Near-miss reporting up 340% indicating positive cultural shift.', 1),
        ('Rural Electrification Through Solar Microgrids', 'community', 125000, 15000000.00, 82.7, 'SDG 7 indicators and household survey', 'Sub-Saharan Africa - 6 countries', '2021-03-01', '2026-03-31', 'active', 'Access to electricity provided for 125,000 beneficiaries across 340 communities. Average household income increased 23%. Health clinic operational hours extended by 6 hours daily. Student study hours increased 2.1 hours daily.', 1),
        ('Living Wage Implementation Program', 'labor_rights', 34000, 12000000.00, 78.9, 'Anker methodology - living wage benchmark', 'Supply chain - Southeast Asia', '2023-09-01', '2025-09-30', 'active', 'Living wage gap closed for 72% of target workforce. Average wage increase of 18% for lowest-paid workers. Productivity improved 12% in participating factories. Worker turnover reduced 45%.', 1),
        ('Digital Literacy for Underserved Youth', 'education', 85000, 6700000.00, 84.5, 'Skills assessment and employment tracking', 'India, Brazil, Nigeria, Indonesia', '2022-01-10', '2025-12-31', 'active', 'Digital skills certification completed by 67,000 youth. Employment rate of graduates at 78% within 6 months. Average starting salary 34% above regional baseline. 23% of graduates pursuing further STEM education.', 1),
        ('Mental Health First Aid Network', 'health_safety', 12000, 2100000.00, 76.8, 'PHQ-9 and GAD-7 validated instruments', 'All office locations - 45 countries', '2024-01-01', '2026-12-31', 'active', 'Mental health first aiders trained: 1,200 across all major sites. Utilization rate of EAP increased 34% indicating reduced stigma. Average days lost to mental health reduced 28%. Manager confidence in supporting mental health increased from 45% to 78%.', 1),
        ('Indigenous Land Rights Partnership', 'community', 8500, 4500000.00, 72.1, 'FPIC compliance assessment and community wellbeing survey', 'Western Australia and Northern Territory', '2022-07-01', '2027-06-30', 'active', 'Free Prior and Informed Consent obtained for all operational activities. Land use agreements benefiting 14 indigenous communities. Cultural heritage site protection protocols in place. Indigenous employment at 18% of local workforce.', 1),
        ('Accessible Workplace Initiative', 'diversity', 3400, 1800000.00, 81.4, 'Disability inclusion benchmark and employee survey', 'North America and Europe', '2023-04-01', '2025-12-31', 'active', 'Disability representation in workforce increased from 3.2% to 5.8%. Accessibility audits completed for all major offices. Assistive technology budget increased 150%. Disability ERG membership tripled.', 1),
        ('Smallholder Farmer Resilience Program', 'community', 45000, 9800000.00, 85.6, 'FAO resilience indicators and yield measurement', 'Cocoa supply chain - Ghana, Ivory Coast', '2021-09-15', '2026-09-30', 'active', 'Average farm yield increased 40% through improved agronomic practices. Income diversification achieved for 72% of participating farmers. Child labor incidence reduced 65%. Shade tree planting at 45 trees per hectare improving biodiversity.', 1),
        ('Supplier Factory Worker Voice Program', 'labor_rights', 156000, 3400000.00, 79.3, 'Worker survey platform with anonymous feedback channel', 'Tier 1 and Tier 2 suppliers - 12 countries', '2023-06-01', '2025-12-31', 'active', 'Anonymous grievance reporting adopted at 89% of target factories. Resolution rate of reported issues at 82%. Forced overtime incidents reduced 56%. Worker satisfaction scores improved from 3.1 to 4.0 out of 5.', 1),
        ('Community Health Clinic Partnership', 'community', 230000, 7200000.00, 88.9, 'Health outcome indicators aligned with WHO framework', 'Operational communities - 8 countries', '2020-01-01', '2025-12-31', 'completed', 'Primary healthcare access provided to 230,000 community members. Maternal mortality in catchment areas reduced 34%. Childhood vaccination rates increased to 91%. Waterborne disease incidence decreased 67%.', 1),
        ('Youth Apprenticeship and Skills Program', 'education', 4500, 5600000.00, 83.2, 'Apprenticeship completion and employment tracking', 'United Kingdom, Germany, South Africa', '2022-09-01', '2026-08-31', 'active', 'Apprenticeship completion rate at 88%. Employment offer rate upon completion at 92%. Diversity of apprentice intake: 45% female, 32% ethnic minority. Program rated Outstanding by UK Ofsted inspection.', 1),
        ('Anti-Forced Labor Supply Chain Initiative', 'labor_rights', 89000, 4100000.00, 74.6, 'Social audit findings and worker interview protocol', 'Global supply chain - high-risk geographies', '2023-01-01', '2025-12-31', 'active', 'Enhanced audits conducted at 340 high-risk facilities. Worker passport retention identified and remediated at 12 facilities. Recruitment fee repayment programs benefiting 2,300 workers. Ethical recruitment agencies certified for 78% of migrant worker placements.', 1),
        ('STEM Scholarship Fund for Underrepresented Groups', 'education', 1200, 8900000.00, 86.7, 'Academic achievement and career progression tracking', 'United States, United Kingdom, India, Brazil', '2019-09-01', '2026-08-31', 'active', 'Scholarship recipients totaling 1,200 across 45 universities. Graduation rate of 94% vs 78% national average. 67% of graduates entering STEM careers. Post-graduation average salary 28% above cohort median.', 1),
        ('Just Transition Community Support Program', 'community', 15000, 11500000.00, 71.8, 'Economic resilience indicators and household survey', 'Coal-dependent communities - Poland, South Africa, Indonesia', '2024-01-01', '2029-12-31', 'active', 'Economic diversification plans developed for 6 communities. Reskilling programs enrolled 3,400 former coal workers. New enterprise creation supported: 145 small businesses. Community renewable energy cooperatives established in 4 locations.', 1);
    `);

    // 16. governance_compliance
    await client.query(`
      INSERT INTO governance_compliance (policy_name, category, compliance_level, last_review_date, next_review_date, responsible_officer, violations_count, training_completion_pct, risk_rating, status, ai_analysis, user_id) VALUES
        ('Board Independence and Composition Policy', 'board', 95.0, '2025-06-15', '2026-06-15', 'Corporate Secretary', 0, 100.0, 'low', 'compliant', 'Board composition exceeds all governance code requirements. Independent directors at 75%. Skills matrix covers all identified competency areas. Tenure policy ensuring regular refreshment without loss of institutional knowledge.', 1),
        ('Code of Business Ethics', 'ethics', 92.3, '2025-03-20', '2026-03-20', 'Chief Ethics Officer', 3, 96.8, 'low', 'compliant', 'Three minor violations reported and remediated. All related to gifts and hospitality threshold exceedances. Ethics hotline received 234 inquiries with 100% response within SLA. Annual ethics survey shows 91% positive ethical culture perception.', 1),
        ('Anti-Bribery and Corruption Policy', 'anti_corruption', 97.8, '2025-09-10', '2026-03-10', 'Chief Compliance Officer', 0, 98.2, 'low', 'compliant', 'Zero bribery incidents for 36 consecutive months. Enhanced due diligence completed for all government-facing contracts. Third-party intermediary risk assessments current for 100% of high-risk agents. UK Bribery Act and FCPA compliance confirmed by external review.', 1),
        ('Executive Compensation Transparency Policy', 'transparency', 88.5, '2025-04-30', '2025-10-30', 'Compensation Committee Chair', 0, 100.0, 'low', 'compliant', 'CEO pay ratio disclosed at 87:1. ESG KPIs represent 25% of long-term incentive plan. Clawback provisions in place for all variable compensation. Say-on-pay approval at 91%.', 1),
        ('Data Privacy and Protection Policy (GDPR)', 'data_privacy', 91.2, '2025-07-22', '2026-01-22', 'Data Protection Officer', 2, 94.5, 'medium', 'compliant', 'Two minor data incidents reported to supervisory authorities. Both resolved without enforcement action. DPIA process embedded in all new product development. Cookie consent management platform achieving 99.7% compliance rate.', 1),
        ('Whistleblower Protection Policy', 'ethics', 96.4, '2025-05-18', '2026-05-18', 'Head of Internal Audit', 0, 92.1, 'low', 'compliant', 'Whistleblower reports: 18 received, 18 investigated, 12 substantiated, 6 unsubstantiated. Zero retaliation incidents. Anonymous reporting channel utilized in 67% of cases. Average investigation completion time: 28 days.', 1),
        ('Board ESG Oversight and Sustainability Governance', 'board', 87.3, '2025-08-05', '2026-02-05', 'Board Sustainability Committee Chair', 0, 100.0, 'low', 'compliant', 'Dedicated Sustainability Committee meets quarterly. Board climate competency training completed. ESG risks integrated into enterprise risk management framework. Material ESG topics reviewed at every board meeting.', 1),
        ('Conflict of Interest Disclosure Policy', 'ethics', 93.7, '2025-02-14', '2025-08-14', 'General Counsel', 1, 97.3, 'low', 'compliant', 'One conflict of interest declared and managed appropriately through recusal. Annual declaration process completed by 100% of directors and senior management. Related party transactions policy reviewed and strengthened.', 1),
        ('Tax Transparency and Responsible Tax Policy', 'transparency', 82.1, '2025-06-30', '2026-06-30', 'Chief Financial Officer', 0, 88.4, 'medium', 'under_review', 'Country-by-country reporting published for all jurisdictions. Effective tax rate at 24.3% aligned with statutory rates. No operations in tax haven jurisdictions. GRI 207 Tax Standard compliance achieved. Policy under review for alignment with Pillar Two global minimum tax.', 1),
        ('Anti-Money Laundering Policy', 'anti_corruption', 98.2, '2025-10-15', '2026-04-15', 'Head of Financial Crime', 0, 99.1, 'low', 'compliant', 'Zero AML violations. KYC procedures enhanced with AI-powered screening. Transaction monitoring system upgrade completed. SAR filing process meets all regulatory timelines across jurisdictions.', 1),
        ('Information Security Governance Policy', 'data_privacy', 89.6, '2025-09-01', '2026-03-01', 'Chief Information Security Officer', 1, 91.8, 'medium', 'compliant', 'SOC 2 Type II certification maintained. One security incident (phishing) contained without data loss. Penetration testing conducted quarterly. Third-party security assessments for critical vendors current.', 1),
        ('Supplier Code of Conduct', 'ethics', 78.4, '2025-07-10', '2026-01-10', 'Chief Procurement Officer', 5, 82.3, 'medium', 'under_review', 'Five supplier violations identified through audit program. Three resolved through corrective action plans. Two suppliers under enhanced monitoring. Code updated to include scope 3 climate commitments and living wage requirements.', 1),
        ('Political Contributions and Lobbying Disclosure', 'transparency', 85.9, '2025-04-15', '2025-10-15', 'VP Government Affairs', 0, 95.6, 'low', 'compliant', 'All political contributions and lobbying expenditures disclosed quarterly. Trade association memberships and climate lobbying alignment reviewed. CPA-Zicklin Index score: Trendsetter category.', 1),
        ('Board Risk Committee Charter', 'board', 94.8, '2025-11-20', '2026-05-20', 'Board Risk Committee Chair', 0, 100.0, 'low', 'compliant', 'Risk appetite framework reviewed and updated annually. Emerging risk register includes 8 ESG-related risks. Climate scenario analysis reviewed at board level. Cyber risk oversight enhanced with quarterly briefings.', 1),
        ('Human Rights Due Diligence Policy', 'ethics', 76.2, '2025-08-30', '2026-02-28', 'Head of Human Rights', 2, 78.9, 'high', 'remediation', 'Salient human rights issues identified through stakeholder engagement. Two remediation processes ongoing for supply chain findings. UNGP reporting framework adopted. Human rights impact assessments conducted for 4 high-risk operations. Training completion needs improvement across non-HQ locations.', 1);
    `);

    console.log('Seed completed successfully!');
    console.log('Tables created: 16');
    console.log('Demo user: admin@esgreporter.com / password123');
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

"""
Script de migração: MongoDB → Supabase
Execute após criar as tabelas no Supabase Dashboard.
Uso: python migrate_data.py
"""
import os
import asyncio
from dotenv import load_dotenv
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from supabase._async.client import create_client as create_async_client
from datetime import datetime

load_dotenv(Path(__file__).parent / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_KEY']


async def migrate():
    # Connect to both databases
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    mongo_db = mongo_client[DB_NAME]
    supabase = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Mapping: old MongoDB ObjectId string → new Supabase UUID string
    user_id_map = {}
    customer_id_map = {}
    loan_id_map = {}
    installment_id_map = {}

    # --- 1. Migrate Users ---
    print("Migrando usuários...")
    users = await mongo_db.users.find({}).to_list(1000)
    for u in users:
        old_id = str(u['_id'])
        doc = {
            'name': u['name'],
            'email': u['email'],
            'password_hash': u['password_hash'],
            'role': u['role'],
            'is_blocked': u.get('is_blocked', False),
            'default_interest_rate': u.get('default_interest_rate'),
            'default_interval_days': u.get('default_interval_days'),
            'created_at': u.get('created_at', datetime.utcnow()).isoformat() if u.get('created_at') else datetime.utcnow().isoformat(),
        }
        result = await supabase.table('users').insert(doc).execute()
        new_id = result.data[0]['id']
        user_id_map[old_id] = new_id
        print(f"  Usuário: {u['name']} ({u['email']}) → {new_id}")

    # --- 2. Migrate Customers ---
    print("\nMigrando clientes...")
    customers = await mongo_db.customers.find({}).to_list(1000)
    for c in customers:
        old_id = str(c['_id'])
        new_user_id = user_id_map.get(c['user_id'])
        if not new_user_id:
            print(f"  SKIP: Cliente {c['name']} - user_id {c['user_id']} não encontrado")
            continue
        doc = {
            'user_id': new_user_id,
            'name': c['name'],
            'phone': c['phone'],
            'email': c.get('email') or None,
            'document': c.get('document') or None,
            'address': c.get('address') or None,
            'notes': c.get('notes') or None,
            'is_referral': c.get('is_referral', False),
            'referral_name': c.get('referral_name'),
            'referral_phone': c.get('referral_phone'),
            'created_at': c.get('created_at', datetime.utcnow()).isoformat() if c.get('created_at') else datetime.utcnow().isoformat(),
        }
        result = await supabase.table('customers').insert(doc).execute()
        new_id = result.data[0]['id']
        customer_id_map[old_id] = new_id
        print(f"  Cliente: {c['name']} → {new_id}")

    # --- 3. Migrate Loans ---
    print("\nMigrando empréstimos...")
    loans = await mongo_db.loans.find({}).to_list(1000)
    for l in loans:
        old_id = str(l['_id'])
        new_user_id = user_id_map.get(l['user_id'])
        new_customer_id = customer_id_map.get(l['customer_id'])
        if not new_user_id or not new_customer_id:
            print(f"  SKIP: Empréstimo {old_id} - IDs não encontrados")
            continue
        doc = {
            'user_id': new_user_id,
            'customer_id': new_customer_id,
            'amount': l['amount'],
            'interest_rate': l['interest_rate'],
            'total_amount': l['total_amount'],
            'number_of_installments': l['number_of_installments'],
            'start_date': l['start_date'],
            'interval_days': l['interval_days'],
            'created_at': l.get('created_at', datetime.utcnow()).isoformat() if l.get('created_at') else datetime.utcnow().isoformat(),
        }
        result = await supabase.table('loans').insert(doc).execute()
        new_id = result.data[0]['id']
        loan_id_map[old_id] = new_id
        print(f"  Empréstimo: R${l['amount']} → {new_id}")

    # --- 4. Migrate Installments ---
    print("\nMigrando parcelas...")
    installments = await mongo_db.installments.find({}).to_list(10000)
    for i in installments:
        old_id = str(i['_id'])
        new_loan_id = loan_id_map.get(i['loan_id'])
        if not new_loan_id:
            print(f"  SKIP: Parcela {old_id} - loan_id {i['loan_id']} não encontrado")
            continue
        doc = {
            'loan_id': new_loan_id,
            'number': i['number'],
            'amount': i['amount'],
            'updated_amount': i.get('updated_amount', i['amount']),
            'due_date': i['due_date'],
            'status': i['status'],
            'paid_at': i.get('paid_at').isoformat() if i.get('paid_at') else None,
        }
        result = await supabase.table('installments').insert(doc).execute()
        new_id = result.data[0]['id']
        installment_id_map[old_id] = new_id

    print(f"  {len(installment_id_map)} parcelas migradas")

    # --- 5. Migrate Payments ---
    print("\nMigrando pagamentos...")
    payments = await mongo_db.payments.find({}).to_list(10000)
    migrated_payments = 0
    for p in payments:
        new_installment_id = installment_id_map.get(p['installment_id'])
        if not new_installment_id:
            print(f"  SKIP: Pagamento - installment_id {p['installment_id']} não encontrado")
            continue
        doc = {
            'installment_id': new_installment_id,
            'amount_paid': p['amount_paid'],
            'payment_date': p.get('payment_date', datetime.utcnow()).isoformat() if p.get('payment_date') else datetime.utcnow().isoformat(),
        }
        await supabase.table('payments').insert(doc).execute()
        migrated_payments += 1

    print(f"  {migrated_payments} pagamentos migrados")

    # Summary
    print("\n=== MIGRAÇÃO COMPLETA ===")
    print(f"Usuários:    {len(user_id_map)}")
    print(f"Clientes:    {len(customer_id_map)}")
    print(f"Empréstimos: {len(loan_id_map)}")
    print(f"Parcelas:    {len(installment_id_map)}")
    print(f"Pagamentos:  {migrated_payments}")

    mongo_client.close()


if __name__ == '__main__':
    asyncio.run(migrate())

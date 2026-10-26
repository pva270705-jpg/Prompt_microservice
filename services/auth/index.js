const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { appFor, listen } = require('../../lib/http');
const { postgres } = require('../../lib/db');
const schema = `CREATE TABLE IF NOT EXISTS roles(roleid SERIAL PRIMARY KEY, rolename VARCHAR(50) UNIQUE NOT NULL);
INSERT INTO roles(rolename) VALUES ('Customer'),('Admin'),('ShipmentStaff') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS users(uid SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE, phone VARCHAR(30), fullname VARCHAR(100), password VARCHAR(255) NOT NULL, roleid INT NOT NULL REFERENCES roles(roleid), created_at TIMESTAMPTZ DEFAULT now());`;
async function main() {
 const db = await postgres(process.env.DATABASE_URL, schema), app = appFor('auth-service');
 const adminUser=process.env.ADMIN_USERNAME,adminPassword=process.env.ADMIN_PASSWORD;
 if(adminUser&&adminPassword){const hash=await bcrypt.hash(adminPassword,12);await db.query("INSERT INTO users(username,password,roleid) VALUES($1,$2,(SELECT roleid FROM roles WHERE rolename='Admin')) ON CONFLICT(username) DO NOTHING",[adminUser,hash]);}
 app.post('/api/auth/register', async (req,res,next)=>{try{const {username,password,email,phone}=req.body||{}; if(!username||!password||password.length<8)return res.status(400).json({error:'username and password (min 8 characters) are required'}); const hash=await bcrypt.hash(password,12); const q=await db.query('INSERT INTO users(username,password,email,phone,roleid) VALUES($1,$2,$3,$4,(SELECT roleid FROM roles WHERE rolename=$5)) RETURNING uid',[''+username,hash,email||null,phone||null,'Customer']);res.status(201).json({message:'User registered successfully',uid:q.rows[0].uid});}catch(e){if(e.code==='23505')return res.status(409).json({error:'Username or email already exists'});next(e);}});
 app.post('/api/auth/login',async(req,res,next)=>{try{const {username,password}=req.body||{};if(!username||!password)return res.status(400).json({error:'username and password are required'});const q=await db.query('SELECT u.uid,u.password,r.rolename FROM users u JOIN roles r USING(roleid) WHERE username=$1',[username]);if(!q.rowCount||!(await bcrypt.compare(password,q.rows[0].password)))return res.status(401).json({error:'Invalid username/password'});const accessToken=jwt.sign({sub:String(q.rows[0].uid),role:q.rows[0].rolename},process.env.JWT_SECRET||'local-dev-change-this-secret',{expiresIn:'1h'});res.json({accessToken,tokenType:'Bearer',expiresIn:3600});}catch(e){next(e);}});
 listen(app,Number(process.env.PORT||3001));
}
main().catch(e=>{console.error(e);process.exit(1)});

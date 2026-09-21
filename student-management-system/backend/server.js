import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const userSchema = new mongoose.Schema({ name:String, email:{type:String,unique:true}, password:String, role:{type:String,enum:['admin','teacher','student'],default:'student'} },{timestamps:true});
const studentSchema = new mongoose.Schema({ rollNo:{type:String,unique:true}, name:String, email:String, phone:String, department:String, year:Number, section:String, course:String },{timestamps:true});
const courseSchema = new mongoose.Schema({ code:{type:String,unique:true}, name:String, credits:Number },{timestamps:true});
const attendanceSchema = new mongoose.Schema({ student:{type:mongoose.Schema.Types.ObjectId,ref:'Student'}, course:{type:mongoose.Schema.Types.ObjectId,ref:'Course'}, date:Date, status:{type:String,enum:['Present','Absent'],default:'Present'} });
const gradeSchema = new mongoose.Schema({ student:{type:mongoose.Schema.Types.ObjectId,ref:'Student'}, course:{type:mongoose.Schema.Types.ObjectId,ref:'Course'}, grade:String, marks:Number });
const User=mongoose.model('User',userSchema), Student=mongoose.model('Student',studentSchema), Course=mongoose.model('Course',courseSchema), Attendance=mongoose.model('Attendance',attendanceSchema), Grade=mongoose.model('Grade',gradeSchema);

function auth(req,res,next){ const h=req.headers.authorization; if(!h) return res.status(401).json({message:'Login required'}); try{req.user=jwt.verify(h.split(' ')[1],process.env.JWT_SECRET); next()}catch{res.status(401).json({message:'Invalid token'})} }
function roles(...allowed){ return (req,res,next)=>allowed.includes(req.user.role)?next():res.status(403).json({message:'Access denied'}); }

app.get('/api/health',(req,res)=>res.json({status:'ok',database:mongoose.connection.readyState===1?'connected':'disconnected'}));
app.post('/api/auth/register',async(req,res)=>{try{const {name,email,password,role='student'}=req.body;if(await User.findOne({email}))return res.status(409).json({message:'Email already registered'});const hash=await bcrypt.hash(password,10);const u=await User.create({name,email,password:hash,role});res.status(201).json({id:u._id,name:u.name,email:u.email,role:u.role})}catch(e){res.status(500).json({message:e.message})}});
app.post('/api/auth/login',async(req,res)=>{try{const u=await User.findOne({email:req.body.email});if(!u||!(await bcrypt.compare(req.body.password,u.password)))return res.status(401).json({message:'Invalid credentials'});const token=jwt.sign({id:u._id,name:u.name,email:u.email,role:u.role},process.env.JWT_SECRET,{expiresIn:'1d'});res.json({token,user:{id:u._id,name:u.name,email:u.email,role:u.role}})}catch(e){res.status(500).json({message:e.message})}});

app.get('/api/students',auth,async(req,res)=>res.json(await Student.find().sort({createdAt:-1})));
app.post('/api/students',auth,roles('admin','teacher'),async(req,res)=>res.status(201).json(await Student.create(req.body)));
app.put('/api/students/:id',auth,roles('admin','teacher'),async(req,res)=>res.json(await Student.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true})));
app.delete('/api/students/:id',auth,roles('admin'),async(req,res)=>{await Student.findByIdAndDelete(req.params.id);res.json({message:'Student deleted'})});

app.get('/api/courses',auth,async(req,res)=>res.json(await Course.find().sort({code:1})));
app.post('/api/courses',auth,roles('admin','teacher'),async(req,res)=>res.status(201).json(await Course.create(req.body)));
app.put('/api/courses/:id',auth,roles('admin','teacher'),async(req,res)=>res.json(await Course.findByIdAndUpdate(req.params.id,req.body,{new:true})));
app.delete('/api/courses/:id',auth,roles('admin'),async(req,res)=>{await Course.findByIdAndDelete(req.params.id);res.json({message:'Course deleted'})});

app.get('/api/attendance',auth,async(req,res)=>res.json(await Attendance.find().populate('student','rollNo name').populate('course','code name').sort({date:-1})));
app.post('/api/attendance',auth,roles('admin','teacher'),async(req,res)=>res.status(201).json(await Attendance.create(req.body)));
app.put('/api/attendance/:id',auth,roles('admin','teacher'),async(req,res)=>res.json(await Attendance.findByIdAndUpdate(req.params.id,req.body,{new:true})));
app.delete('/api/attendance/:id',auth,roles('admin','teacher'),async(req,res)=>{await Attendance.findByIdAndDelete(req.params.id);res.json({message:'Attendance deleted'})});

app.get('/api/grades',auth,async(req,res)=>res.json(await Grade.find().populate('student','rollNo name').populate('course','code name').sort({marks:-1})));
app.post('/api/grades',auth,roles('admin','teacher'),async(req,res)=>res.status(201).json(await Grade.create(req.body)));
app.put('/api/grades/:id',auth,roles('admin','teacher'),async(req,res)=>res.json(await Grade.findByIdAndUpdate(req.params.id,req.body,{new:true})));
app.delete('/api/grades/:id',auth,roles('admin','teacher'),async(req,res)=>{await Grade.findByIdAndDelete(req.params.id);res.json({message:'Grade deleted'})});

app.get('/api/dashboard',auth,async(req,res)=>{const [students,courses,attendance,grades]=await Promise.all([Student.countDocuments(),Course.countDocuments(),Attendance.countDocuments(),Grade.countDocuments()]);res.json({students,courses,attendance,grades})});

const port=process.env.PORT||5000;
mongoose.connect(process.env.MONGO_URI||'mongodb://127.0.0.1:27017/student_management').then(()=>{console.log('MongoDB connected');app.listen(port,()=>console.log(`Server running at http://localhost:${port}`));}).catch(e=>{console.error('MongoDB connection failed:',e.message);process.exit(1)});

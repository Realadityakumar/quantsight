"use client"
import {CountrySelectField} from "@/components/forms/CountrySelectField"
import FooterLink from "@/components/forms/FooterLink"
import { InputField } from "@/components/forms/InputField"
import SelectField from "@/components/forms/SelectField"
import { Button } from "@/components/ui/button"
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants"
import { SubmitHandler, useForm } from "react-hook-form"



const SignUp = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors,isSubmitting }, 

  } = useForm<SignUpFormData>({

    defaultValues:{
      fullName: '',
      email: '',
      password: '',
      country: 'IN',
      investmentGoals: 'Growth',
      riskTolerance: 'Medium',
      preferredIndustry: 'Technology'
    },
    mode:'onBlur'
    }
)
  const onSubmit: SubmitHandler<SignUpFormData> = async (data:SignUpFormData) =>{
    try{
      console.log(data);
    }catch(error){
      console.error("Error during sign-up:", error)
    }

  }


  return (
    <>
      <h1 className="form-title">Sign Up & Personalize</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        <InputField  
          name="fullName"
          label="Full Name"
          placeholder="Enter your full name"
          register={register}
          error={errors.fullName}
          validation={{ required: 'full Name is required',minLength: 2 }}
        />
        <InputField  
          name="email"
          label="Email"
          placeholder="Enter your email"
          register={register}
          error={errors.email}
          validation={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } }}
        />
        <InputField  
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: 'Password is required', minLength: 6 }}
        />
        {/* Country */}
        <CountrySelectField 
         name="country" 
         label="Country"
         // @ts-ignore
         control={control} 
         error={errors.country} 
         required
          />
        <SelectField
          name="investmentGoals"
          label="Investment Goals"
          placeholder="Select your investment goals"
          options={INVESTMENT_GOALS}
          control={control}
          error={errors.investmentGoals}
          required 
        />
        <SelectField
          name="riskTolerance"
          label="Risk Tolerance"
          placeholder="Select your risk tolerance"
          options={RISK_TOLERANCE_OPTIONS}
          control={control}
          error={errors.riskTolerance}
          required 
        />
        <SelectField
          name="preferredIndustry"
          label="Preferred Industry"
          placeholder="Select your preferred industry"
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required 
        />
        <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
          {isSubmitting ? 'Creating Account' : 'Sign Up'}
        </Button>
        <FooterLink 
          text="Already have an account?" 
          linkText="Sign in" 
          href="/sign-in" 
        />

      </form>
    </>
  )
}

export default SignUp
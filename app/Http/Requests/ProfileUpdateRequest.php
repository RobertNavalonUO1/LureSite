<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'lastname' => ['nullable', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'phone' => ['nullable', 'string', 'regex:/^\+?[0-9\s\-()]{7,20}$/'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'default_address_id' => [
                'nullable',
                Rule::exists('addresses', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()->id)
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => __('profile.name_required'),
            'email.required' => __('profile.email_required'),
            'email.email' => __('profile.email_invalid'),
            'email.unique' => __('profile.email_taken'),
            'phone.regex' => __('profile.phone_invalid'),
            'default_address_id.exists' => __('profile.default_address_invalid'),
        ];
    }
}

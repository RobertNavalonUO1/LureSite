<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'street' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:255'],
            'zip_code' => ['required', 'string', 'max:30'],
            'country' => ['required', 'string', 'max:255'],
            'make_default' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'street.required' => __('profile.address.street_required'),
            'city.required' => __('profile.address.city_required'),
            'province.required' => __('profile.address.province_required'),
            'zip_code.required' => __('profile.address.zip_code_required'),
            'country.required' => __('profile.address.country_required'),
        ];
    }
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function MembershipForm() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold">
          THE TANDUR STONE MERCHANT'S WELFARE ASSOCIATION
        </h1>
        <p className="text-sm">(Regd. No. 2347/1992)</p>
        <p className="text-sm mt-2">
          #1-6-135/3A, STONE BHAVAN, Opp. CHANDRA 70MM, RAGHAVENDRA COLONY,
          TANDUR -501141,
          <br />
          VIKARABAD DIST., TELANGANA.
        </p>
      </header>

      <h2 className="text-xl font-semibold text-center mb-6">
        APPLICATION FOR MEMBERSHIP
      </h2>

      <form className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Textarea id="from" className="w-64 h-24" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input type="date" id="date" className="w-40" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="officePhone">Office Phone</Label>
            <Input type="tel" id="officePhone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="residencePhone">Residence Phone</Label>
            <Input type="tel" id="residencePhone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cellPhone">Cell Phone</Label>
            <Input type="tel" id="cellPhone" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="applicantName">Applicant Name</Label>
          <Input id="applicantName" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentName">S/o, D/o, W/o</Label>
          <Input id="parentName" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firmName">1) Name of the Firm</Label>
            <Input id="firmName" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessPlace">2) Place of Business</Label>
            <Textarea id="businessPlace" />
          </div>

          <div className="space-y-2">
            <Label>3) Owner / Tenant / Trader</Label>
            <RadioGroup defaultValue="owner">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner">Owner</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tenant" id="tenant" />
                <Label htmlFor="tenant">Tenant</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trader" id="trader" />
                <Label htmlFor="trader">Trader</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="electricalService">
              4) Electrical Service Number
            </Label>
            <Input id="electricalService" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sanctionedHP">5) Sanctioned HP</Label>
            <Input id="sanctionedHP" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proprietor">
              6) Name of the Proprietor / Managing Partner / Tenant
            </Label>
            <Input id="proprietor" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="communicationAddress">
              7) Address for Communication
            </Label>
            <Textarea id="communicationAddress" />
          </div>

          <div className="space-y-2">
            <Label>8) Contact No.s</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Contact 1" />
              <Input placeholder="Contact 2" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">9) Email ID</Label>
            <Input type="email" id="email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aadhar">10) Aadhar No.</Label>
            <Input id="aadhar" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pan">11) PAN No.</Label>
            <Input id="pan" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">12) GSTIN No.</Label>
            <Input id="gstin" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mdl">13) M.D.L No.</Label>
            <Input id="mdl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="factoryLicense">14) Factory License No.</Label>
            <Input id="factoryLicense" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tspcbOrder">15) TSPCB Order No.</Label>
            <Input id="tspcbOrder" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="representative">
              16) Name of the Representative/Partner
            </Label>
            <Input id="representative" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="representativeContact">17) Contact No.</Label>
            <Input id="representativeContact" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="representativeAadhar">18) Aadhar No.</Label>
            <Input id="representativeAadhar" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Photo of Partner/Representative</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Input type="file" className="hidden" id="partnerPhoto" />
              <Label
                htmlFor="partnerPhoto"
                className="cursor-pointer text-blue-500 hover:text-blue-600"
              >
                Click to upload photo
              </Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Photo of the Applicant</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Input type="file" className="hidden" id="applicantPhoto" />
              <Label
                htmlFor="applicantPhoto"
                className="cursor-pointer text-blue-500 hover:text-blue-600"
              >
                Click to upload photo
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Are you A Member of any similar Organisation/Association:
          </Label>
          <RadioGroup defaultValue="no">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes">YES</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no">NO</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousMembership">
            Have you applied for the Membership earlier if yes, please furnish
            details
          </Label>
          <Input id="previousMembership" />
        </div>

        <div className="space-y-2">
          <p className="font-semibold">PROPOSERS</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>1st PROPOSER=Factory Owner/Valid Member</Label>
              <Input placeholder="Signature" />
              <Input placeholder="Name" />
              <Input placeholder="Firm Name" />
              <Textarea placeholder="Address" />
            </div>
            <div className="space-y-2">
              <Label>2nd PROPOSER=Executive Member</Label>
              <Input placeholder="Signature" />
              <Input placeholder="Name" />
              <Input placeholder="Firm Name" />
              <Textarea placeholder="Address" />
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold">NOTE:</p>
          <ol className="list-decimal list-inside">
            <li>Proposers should be the valid Members of the Association.</li>
            <li>
              Second Proposers should be the Executive Body Member of the
              Association.
            </li>
            <li>If Tenant, please submit your valid Rental Deed.</li>
            <li>If Partnership firm please submit Partnership Deed.</li>
          </ol>
        </div>

        <div className="text-center">
          <Button type="submit" className="w-full md:w-auto">
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}

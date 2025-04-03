// Code generated by BobGen mysql v0.31.0. DO NOT EDIT.
// This file is meant to be re-generated in place and/or deleted at any time.

package factory

import (
	"context"
	"testing"

	"github.com/aarondl/opt/null"
	"github.com/aarondl/opt/omit"
	"github.com/aarondl/opt/omitnull"
	"github.com/jaswdr/faker/v2"
	"github.com/stephenafamo/bob"
	models "github.com/xtp-tour/xtp-tour/api/pkg/db/models"
)

type CourtGroupMod interface {
	Apply(*CourtGroupTemplate)
}

type CourtGroupModFunc func(*CourtGroupTemplate)

func (f CourtGroupModFunc) Apply(n *CourtGroupTemplate) {
	f(n)
}

type CourtGroupModSlice []CourtGroupMod

func (mods CourtGroupModSlice) Apply(n *CourtGroupTemplate) {
	for _, f := range mods {
		f.Apply(n)
	}
}

// CourtGroupTemplate is an object representing the database table.
// all columns are optional and should be set by mods
type CourtGroupTemplate struct {
	ID              func() int32
	FacilityID      func() string
	Surface         func() CourtGroupsSurface
	Type            func() CourtGroupsType
	Light           func() null.Val[bool]
	Heating         func() null.Val[bool]
	ReservationLink func() null.Val[string]
	CourtNames      func() null.Val[string]

	r courtGroupR
	f *Factory
}

type courtGroupR struct {
	Facility     *courtGroupRFacilityR
	PricePeriods []*courtGroupRPricePeriodsR
}

type courtGroupRFacilityR struct {
	o *FacilityTemplate
}
type courtGroupRPricePeriodsR struct {
	number int
	o      *PricePeriodTemplate
}

// Apply mods to the CourtGroupTemplate
func (o *CourtGroupTemplate) Apply(mods ...CourtGroupMod) {
	for _, mod := range mods {
		mod.Apply(o)
	}
}

// toModel returns an *models.CourtGroup
// this does nothing with the relationship templates
func (o CourtGroupTemplate) toModel() *models.CourtGroup {
	m := &models.CourtGroup{}

	if o.ID != nil {
		m.ID = o.ID()
	}
	if o.FacilityID != nil {
		m.FacilityID = o.FacilityID()
	}
	if o.Surface != nil {
		m.Surface = o.Surface()
	}
	if o.Type != nil {
		m.Type = o.Type()
	}
	if o.Light != nil {
		m.Light = o.Light()
	}
	if o.Heating != nil {
		m.Heating = o.Heating()
	}
	if o.ReservationLink != nil {
		m.ReservationLink = o.ReservationLink()
	}
	if o.CourtNames != nil {
		m.CourtNames = o.CourtNames()
	}

	return m
}

// toModels returns an models.CourtGroupSlice
// this does nothing with the relationship templates
func (o CourtGroupTemplate) toModels(number int) models.CourtGroupSlice {
	m := make(models.CourtGroupSlice, number)

	for i := range m {
		m[i] = o.toModel()
	}

	return m
}

// setModelRels creates and sets the relationships on *models.CourtGroup
// according to the relationships in the template. Nothing is inserted into the db
func (t CourtGroupTemplate) setModelRels(o *models.CourtGroup) {
	if t.r.Facility != nil {
		rel := t.r.Facility.o.toModel()
		rel.R.CourtGroups = append(rel.R.CourtGroups, o)
		o.FacilityID = rel.ID
		o.R.Facility = rel
	}

	if t.r.PricePeriods != nil {
		rel := models.PricePeriodSlice{}
		for _, r := range t.r.PricePeriods {
			related := r.o.toModels(r.number)
			for _, rel := range related {
				rel.CourtGroupID = o.ID
				rel.R.CourtGroup = o
			}
			rel = append(rel, related...)
		}
		o.R.PricePeriods = rel
	}
}

// BuildSetter returns an *models.CourtGroupSetter
// this does nothing with the relationship templates
func (o CourtGroupTemplate) BuildSetter() *models.CourtGroupSetter {
	m := &models.CourtGroupSetter{}

	if o.ID != nil {
		m.ID = omit.From(o.ID())
	}
	if o.FacilityID != nil {
		m.FacilityID = omit.From(o.FacilityID())
	}
	if o.Surface != nil {
		m.Surface = omit.From(o.Surface())
	}
	if o.Type != nil {
		m.Type = omit.From(o.Type())
	}
	if o.Light != nil {
		m.Light = omitnull.FromNull(o.Light())
	}
	if o.Heating != nil {
		m.Heating = omitnull.FromNull(o.Heating())
	}
	if o.ReservationLink != nil {
		m.ReservationLink = omitnull.FromNull(o.ReservationLink())
	}
	if o.CourtNames != nil {
		m.CourtNames = omitnull.FromNull(o.CourtNames())
	}

	return m
}

// BuildManySetter returns an []*models.CourtGroupSetter
// this does nothing with the relationship templates
func (o CourtGroupTemplate) BuildManySetter(number int) []*models.CourtGroupSetter {
	m := make([]*models.CourtGroupSetter, number)

	for i := range m {
		m[i] = o.BuildSetter()
	}

	return m
}

// Build returns an *models.CourtGroup
// Related objects are also created and placed in the .R field
// NOTE: Objects are not inserted into the database. Use CourtGroupTemplate.Create
func (o CourtGroupTemplate) Build() *models.CourtGroup {
	m := o.toModel()
	o.setModelRels(m)

	return m
}

// BuildMany returns an models.CourtGroupSlice
// Related objects are also created and placed in the .R field
// NOTE: Objects are not inserted into the database. Use CourtGroupTemplate.CreateMany
func (o CourtGroupTemplate) BuildMany(number int) models.CourtGroupSlice {
	m := make(models.CourtGroupSlice, number)

	for i := range m {
		m[i] = o.Build()
	}

	return m
}

func ensureCreatableCourtGroup(m *models.CourtGroupSetter) {
	if m.FacilityID.IsUnset() {
		m.FacilityID = omit.From(random_string(nil))
	}
	if m.Surface.IsUnset() {
		m.Surface = omit.From(random_CourtGroupsSurface(nil))
	}
	if m.Type.IsUnset() {
		m.Type = omit.From(random_CourtGroupsType(nil))
	}
}

// insertOptRels creates and inserts any optional the relationships on *models.CourtGroup
// according to the relationships in the template.
// any required relationship should have already exist on the model
func (o *CourtGroupTemplate) insertOptRels(ctx context.Context, exec bob.Executor, m *models.CourtGroup) (context.Context, error) {
	var err error

	if o.r.PricePeriods != nil {
		for _, r := range o.r.PricePeriods {
			var rel1 models.PricePeriodSlice
			ctx, rel1, err = r.o.createMany(ctx, exec, r.number)
			if err != nil {
				return ctx, err
			}

			err = m.AttachPricePeriods(ctx, exec, rel1...)
			if err != nil {
				return ctx, err
			}
		}
	}

	return ctx, err
}

// Create builds a courtGroup and inserts it into the database
// Relations objects are also inserted and placed in the .R field
func (o *CourtGroupTemplate) Create(ctx context.Context, exec bob.Executor) (*models.CourtGroup, error) {
	_, m, err := o.create(ctx, exec)
	return m, err
}

// MustCreate builds a courtGroup and inserts it into the database
// Relations objects are also inserted and placed in the .R field
// panics if an error occurs
func (o *CourtGroupTemplate) MustCreate(ctx context.Context, exec bob.Executor) *models.CourtGroup {
	_, m, err := o.create(ctx, exec)
	if err != nil {
		panic(err)
	}
	return m
}

// CreateOrFail builds a courtGroup and inserts it into the database
// Relations objects are also inserted and placed in the .R field
// It calls `tb.Fatal(err)` on the test/benchmark if an error occurs
func (o *CourtGroupTemplate) CreateOrFail(ctx context.Context, tb testing.TB, exec bob.Executor) *models.CourtGroup {
	tb.Helper()
	_, m, err := o.create(ctx, exec)
	if err != nil {
		tb.Fatal(err)
		return nil
	}
	return m
}

// create builds a courtGroup and inserts it into the database
// Relations objects are also inserted and placed in the .R field
// this returns a context that includes the newly inserted model
func (o *CourtGroupTemplate) create(ctx context.Context, exec bob.Executor) (context.Context, *models.CourtGroup, error) {
	var err error
	opt := o.BuildSetter()
	ensureCreatableCourtGroup(opt)

	var rel0 *models.Facility
	if o.r.Facility == nil {
		var ok bool
		rel0, ok = facilityCtx.Value(ctx)
		if !ok {
			CourtGroupMods.WithNewFacility().Apply(o)
		}
	}
	if o.r.Facility != nil {
		ctx, rel0, err = o.r.Facility.o.create(ctx, exec)
		if err != nil {
			return ctx, nil, err
		}
	}
	opt.FacilityID = omit.From(rel0.ID)

	m, err := models.CourtGroups.Insert(opt).One(ctx, exec)
	if err != nil {
		return ctx, nil, err
	}
	ctx = courtGroupCtx.WithValue(ctx, m)

	m.R.Facility = rel0

	ctx, err = o.insertOptRels(ctx, exec, m)
	return ctx, m, err
}

// CreateMany builds multiple courtGroups and inserts them into the database
// Relations objects are also inserted and placed in the .R field
func (o CourtGroupTemplate) CreateMany(ctx context.Context, exec bob.Executor, number int) (models.CourtGroupSlice, error) {
	_, m, err := o.createMany(ctx, exec, number)
	return m, err
}

// MustCreateMany builds multiple courtGroups and inserts them into the database
// Relations objects are also inserted and placed in the .R field
// panics if an error occurs
func (o CourtGroupTemplate) MustCreateMany(ctx context.Context, exec bob.Executor, number int) models.CourtGroupSlice {
	_, m, err := o.createMany(ctx, exec, number)
	if err != nil {
		panic(err)
	}
	return m
}

// CreateManyOrFail builds multiple courtGroups and inserts them into the database
// Relations objects are also inserted and placed in the .R field
// It calls `tb.Fatal(err)` on the test/benchmark if an error occurs
func (o CourtGroupTemplate) CreateManyOrFail(ctx context.Context, tb testing.TB, exec bob.Executor, number int) models.CourtGroupSlice {
	tb.Helper()
	_, m, err := o.createMany(ctx, exec, number)
	if err != nil {
		tb.Fatal(err)
		return nil
	}
	return m
}

// createMany builds multiple courtGroups and inserts them into the database
// Relations objects are also inserted and placed in the .R field
// this returns a context that includes the newly inserted models
func (o CourtGroupTemplate) createMany(ctx context.Context, exec bob.Executor, number int) (context.Context, models.CourtGroupSlice, error) {
	var err error
	m := make(models.CourtGroupSlice, number)

	for i := range m {
		ctx, m[i], err = o.create(ctx, exec)
		if err != nil {
			return ctx, nil, err
		}
	}

	return ctx, m, nil
}

// CourtGroup has methods that act as mods for the CourtGroupTemplate
var CourtGroupMods courtGroupMods

type courtGroupMods struct{}

func (m courtGroupMods) RandomizeAllColumns(f *faker.Faker) CourtGroupMod {
	return CourtGroupModSlice{
		CourtGroupMods.RandomID(f),
		CourtGroupMods.RandomFacilityID(f),
		CourtGroupMods.RandomSurface(f),
		CourtGroupMods.RandomType(f),
		CourtGroupMods.RandomLight(f),
		CourtGroupMods.RandomHeating(f),
		CourtGroupMods.RandomReservationLink(f),
		CourtGroupMods.RandomCourtNames(f),
	}
}

// Set the model columns to this value
func (m courtGroupMods) ID(val int32) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.ID = func() int32 { return val }
	})
}

// Set the Column from the function
func (m courtGroupMods) IDFunc(f func() int32) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.ID = f
	})
}

// Clear any values for the column
func (m courtGroupMods) UnsetID() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.ID = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m courtGroupMods) RandomID(f *faker.Faker) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.ID = func() int32 {
			return random_int32(f)
		}
	})
}

// Set the model columns to this value
func (m courtGroupMods) FacilityID(val string) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.FacilityID = func() string { return val }
	})
}

// Set the Column from the function
func (m courtGroupMods) FacilityIDFunc(f func() string) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.FacilityID = f
	})
}

// Clear any values for the column
func (m courtGroupMods) UnsetFacilityID() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.FacilityID = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m courtGroupMods) RandomFacilityID(f *faker.Faker) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.FacilityID = func() string {
			return random_string(f)
		}
	})
}

// Set the model columns to this value
func (m courtGroupMods) Surface(val CourtGroupsSurface) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Surface = func() CourtGroupsSurface { return val }
	})
}

// Set the Column from the function
func (m courtGroupMods) SurfaceFunc(f func() CourtGroupsSurface) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Surface = f
	})
}

// Clear any values for the column
func (m courtGroupMods) UnsetSurface() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Surface = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m courtGroupMods) RandomSurface(f *faker.Faker) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Surface = func() CourtGroupsSurface {
			return random_CourtGroupsSurface(f)
		}
	})
}

// Set the model columns to this value
func (m courtGroupMods) Type(val CourtGroupsType) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Type = func() CourtGroupsType { return val }
	})
}

// Set the Column from the function
func (m courtGroupMods) TypeFunc(f func() CourtGroupsType) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Type = f
	})
}

// Clear any values for the column
func (m courtGroupMods) UnsetType() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Type = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m courtGroupMods) RandomType(f *faker.Faker) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Type = func() CourtGroupsType {
			return random_CourtGroupsType(f)
		}
	})
}

// Set the model columns to this value
func (m courtGroupMods) Light(val null.Val[bool]) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Light = func() null.Val[bool] { return val }
	})
}

// Set the Column from the function
func (m courtGroupMods) LightFunc(f func() null.Val[bool]) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Light = f
	})
}

// Clear any values for the column
func (m courtGroupMods) UnsetLight() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Light = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m courtGroupMods) RandomLight(f *faker.Faker) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Light = func() null.Val[bool] {
			if f == nil {
				f = &defaultFaker
			}

			if f.Bool() {
				return null.FromPtr[bool](nil)
			}

			return null.From(random_bool(f))
		}
	})
}

// Set the model columns to this value
func (m courtGroupMods) Heating(val null.Val[bool]) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Heating = func() null.Val[bool] { return val }
	})
}

// Set the Column from the function
func (m courtGroupMods) HeatingFunc(f func() null.Val[bool]) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Heating = f
	})
}

// Clear any values for the column
func (m courtGroupMods) UnsetHeating() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Heating = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m courtGroupMods) RandomHeating(f *faker.Faker) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.Heating = func() null.Val[bool] {
			if f == nil {
				f = &defaultFaker
			}

			if f.Bool() {
				return null.FromPtr[bool](nil)
			}

			return null.From(random_bool(f))
		}
	})
}

// Set the model columns to this value
func (m courtGroupMods) ReservationLink(val null.Val[string]) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.ReservationLink = func() null.Val[string] { return val }
	})
}

// Set the Column from the function
func (m courtGroupMods) ReservationLinkFunc(f func() null.Val[string]) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.ReservationLink = f
	})
}

// Clear any values for the column
func (m courtGroupMods) UnsetReservationLink() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.ReservationLink = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m courtGroupMods) RandomReservationLink(f *faker.Faker) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.ReservationLink = func() null.Val[string] {
			if f == nil {
				f = &defaultFaker
			}

			if f.Bool() {
				return null.FromPtr[string](nil)
			}

			return null.From(random_string(f))
		}
	})
}

// Set the model columns to this value
func (m courtGroupMods) CourtNames(val null.Val[string]) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.CourtNames = func() null.Val[string] { return val }
	})
}

// Set the Column from the function
func (m courtGroupMods) CourtNamesFunc(f func() null.Val[string]) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.CourtNames = f
	})
}

// Clear any values for the column
func (m courtGroupMods) UnsetCourtNames() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.CourtNames = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m courtGroupMods) RandomCourtNames(f *faker.Faker) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.CourtNames = func() null.Val[string] {
			if f == nil {
				f = &defaultFaker
			}

			if f.Bool() {
				return null.FromPtr[string](nil)
			}

			return null.From(random_string(f))
		}
	})
}

func (m courtGroupMods) WithFacility(rel *FacilityTemplate) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.r.Facility = &courtGroupRFacilityR{
			o: rel,
		}
	})
}

func (m courtGroupMods) WithNewFacility(mods ...FacilityMod) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		related := o.f.NewFacility(mods...)

		m.WithFacility(related).Apply(o)
	})
}

func (m courtGroupMods) WithoutFacility() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.r.Facility = nil
	})
}

func (m courtGroupMods) WithPricePeriods(number int, related *PricePeriodTemplate) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.r.PricePeriods = []*courtGroupRPricePeriodsR{{
			number: number,
			o:      related,
		}}
	})
}

func (m courtGroupMods) WithNewPricePeriods(number int, mods ...PricePeriodMod) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		related := o.f.NewPricePeriod(mods...)
		m.WithPricePeriods(number, related).Apply(o)
	})
}

func (m courtGroupMods) AddPricePeriods(number int, related *PricePeriodTemplate) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.r.PricePeriods = append(o.r.PricePeriods, &courtGroupRPricePeriodsR{
			number: number,
			o:      related,
		})
	})
}

func (m courtGroupMods) AddNewPricePeriods(number int, mods ...PricePeriodMod) CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		related := o.f.NewPricePeriod(mods...)
		m.AddPricePeriods(number, related).Apply(o)
	})
}

func (m courtGroupMods) WithoutPricePeriods() CourtGroupMod {
	return CourtGroupModFunc(func(o *CourtGroupTemplate) {
		o.r.PricePeriods = nil
	})
}
